import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  fetchCategoryMap,
  marketToBond,
  type BondsPayload,
  type RawMarket,
} from "../lib/bonds";

async function main() {
  const rawDir = join(process.cwd(), "data", "raw");
  const files = (await readdir(rawDir)).filter((f) => f.endsWith(".json"));
  const byId = new Map<string, RawMarket>();

  for (const file of files) {
    const text = await readFile(join(rawDir, file), "utf8");
    // WebFetch may wrap JSON in markdown fences
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < 0) continue;
    const page = JSON.parse(text.slice(start, end + 1)) as RawMarket[];
    for (const m of page) {
      const id = String(m.id ?? m.slug ?? "");
      if (id && !byId.has(id)) byId.set(id, m);
    }
  }

  const now = new Date();
  const year = now.getUTCFullYear();
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
  ].slice(0, 200);

  // Skip live category fetch if network is down — keep Other
  let lookup = {
    categoryBySlug: new Map(),
    excludedSlugs: new Set<string>(),
  };
  try {
    lookup = await fetchCategoryMap(year, slugs);
  } catch {
    // offline
  }

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

  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(
    join(process.cwd(), "data", "bonds.json"),
    JSON.stringify(payload)
  );
  console.log("markets", byId.size, "bonds", kept.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
