import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, setGlobalDispatcher, fetch as undiciFetch } from "undici";
import {
  fetchCategoryMap,
  marketToBond,
  yearEndCutoff,
  type BondsPayload,
  type RawMarket,
} from "../lib/bonds";

setGlobalDispatcher(
  new Agent({
    connect: { timeout: 90_000 },
    headersTimeout: 180_000,
    bodyTimeout: 180_000,
  })
);

const GAMMA = "https://gamma-api.polymarket.com";
const PAGE = 100;
const MAX_OFFSET = 2000;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function fetchPages(query: Record<string, string>): Promise<RawMarket[]> {
  const out: RawMarket[] = [];
  for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE) {
    const url = new URL("/markets", GAMMA);
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    url.searchParams.set("limit", String(PAGE));
    url.searchParams.set("offset", String(offset));

    let lastErr: unknown;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await undiciFetch(url);
        if (res.status === 422) return out;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const page = (await res.json()) as RawMarket[];
        if (!Array.isArray(page)) throw new Error("bad page");
        out.push(...page);
        if (page.length < PAGE) return out;
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    if (lastErr) throw lastErr;
  }
  return out;
}

async function main() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const nowISO = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endMax = yearEndCutoff(year).toISOString().replace(/\.\d{3}Z$/, "Z");
  const base = {
    closed: "false",
    active: "true",
    end_date_min: nowISO,
    end_date_max: endMax,
    liquidity_num_min: "1000",
  };

  const byId = new Map<string, RawMarket>();
  for (const sort of [
    { order: "liquidityNum", ascending: "false" },
    { order: "volume24hr", ascending: "false" },
    { order: "endDate", ascending: "true" },
  ]) {
    console.log("pass", sort.order);
    const page = await fetchPages({ ...base, ...sort });
    for (const m of page) {
      const id = String(m.id ?? m.slug ?? "");
      if (id && !byId.has(id)) byId.set(id, m);
    }
    console.log("  unique", byId.size);
  }

  const bonds = [];
  for (const market of byId.values()) {
    const bond = marketToBond(market, { now, year, minPrice: 0.95 });
    if (bond) bonds.push(bond);
  }
  bonds.sort((a, b) => b.liquidity - a.liquidity);

  const slugs = [
    ...new Set(
      bonds.map((b) => b.tradeUrl.match(/\/event\/([^/?#]+)/)?.[1] ?? b.slug)
    ),
  ].slice(0, 250);

  const lookup = await fetchCategoryMap(year, slugs).catch(() => ({
    categoryBySlug: new Map(),
    excludedSlugs: new Set<string>(),
  }));

  const kept = [];
  for (const bond of bonds) {
    const eventSlug =
      bond.tradeUrl.match(/\/event\/([^/?#]+)/)?.[1] ?? bond.slug;
    if (lookup.excludedSlugs.has(eventSlug)) continue;
    bond.category = lookup.categoryBySlug.get(eventSlug) ?? "Other";
    kept.push(bond);
  }
  kept.sort((a, b) => b.apy - a.apy);

  const payload: BondsPayload = {
    bonds: kept,
    fetchedAt: now.toISOString(),
    year,
  };

  const outPath = join(root, "data", "bonds.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload));
  console.log("wrote", outPath, "bonds", kept.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
