"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BondTable, BOND_PAGE_SIZE } from "@/components/BondTable";
import { Controls } from "@/components/Controls";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import {
  BOND_CATEGORIES,
  computeAggregates,
  filterBonds,
  formatReturnPct,
  sortBonds,
  type Bond,
  type BondsPayload,
  type CategoryFilter,
  type RangeFilter,
  type SortKey,
} from "@/lib/bonds";

function parseRange(value: string | null): RangeFilter {
  if (value === "week" || value === "month" || value === "year") return value;
  return "year";
}

function parseMin(value: string | null): number {
  const n = Number(value);
  if (n === 0.95 || n === 0.97) return n;
  return 0.95;
}

function parseAmount(value: string | null): number {
  if (value == null || value.trim() === "") return 1000;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 1000;
  return Math.round(n);
}

function parseSort(value: string | null): SortKey {
  if (value === "return" || value === "ends" || value === "liquidity" || value === "apy") {
    return value;
  }
  return "apy";
}

function parseCategory(value: string | null): CategoryFilter {
  if (value === "all") return "all";
  if (value && (BOND_CATEGORIES as string[]).includes(value)) {
    return value as CategoryFilter;
  }
  return "all";
}

type Filters = {
  range: RangeFilter;
  minPrice: number;
  amount: number;
  sort: SortKey;
  category: CategoryFilter;
  query: string;
};

function filtersFromSearch(params: URLSearchParams): Filters {
  return {
    range: parseRange(params.get("range")),
    minPrice: parseMin(params.get("min")),
    amount: parseAmount(params.get("amt")),
    sort: parseSort(params.get("sort")),
    category: parseCategory(params.get("cat")),
    query: params.get("q") ?? "",
  };
}

function writeUrl(pathname: string, filters: Filters) {
  const params = new URLSearchParams();
  if (filters.range !== "year") params.set("range", filters.range);
  if (filters.minPrice !== 0.95) params.set("min", String(filters.minPrice));
  if (filters.amount !== 1000) params.set("amt", String(filters.amount));
  if (filters.sort !== "apy") params.set("sort", filters.sort);
  if (filters.category !== "all") params.set("cat", filters.category);
  if (filters.query.trim()) params.set("q", filters.query.trim());

  const qs = params.toString();
  const next = qs ? `${pathname}?${qs}` : pathname;
  window.history.replaceState(null, "", next);
}

export function PolyBondsApp({ initial }: { initial: BondsPayload }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromSearch(new URLSearchParams(searchParams.toString()))
  );
  const [visibleCount, setVisibleCount] = useState(BOND_PAGE_SIZE);

  const patchFilters = useCallback(
    (patch: Partial<Filters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        writeUrl(pathname, next);
        return next;
      });
      setVisibleCount(BOND_PAGE_SIZE);
    },
    [pathname]
  );

  // Keep share URL in sync if someone pastes a link mid-session
  useEffect(() => {
    const onPop = () => {
      setFilters(filtersFromSearch(new URLSearchParams(window.location.search)));
      setVisibleCount(BOND_PAGE_SIZE);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const filtered = useMemo(() => {
    const list = filterBonds(initial.bonds, {
      range: filters.range,
      minPrice: filters.minPrice,
      q: filters.query,
      category: filters.category,
    });
    return sortBonds(list, filters.sort);
  }, [initial.bonds, filters]);

  const aggregates = useMemo(() => computeAggregates(filtered), [filtered]);

  function shareOnX() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${aggregates.count} Polymarket bonds paying out before Dec 31. Avg return ${formatReturnPct(aggregates.avgReturn)}.`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  const showError = Boolean(initial.error) && initial.bonds.length === 0;

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center px-4 py-4 md:px-6">
          <p className="text-[18px] font-semibold tracking-[-0.02em]">PolyBonds</p>
        </div>
      </header>

      {showError ? (
        <div className="mx-auto max-w-[1200px] px-4 py-24 text-center md:px-6">
          <p className="text-[16px] text-ink">
            Polymarket data is temporarily unavailable
          </p>
        </div>
      ) : (
        <>
          <Hero aggregates={aggregates} year={initial.year} />

          <main className="mx-auto max-w-[1200px] px-4 md:px-6">
            <Controls
              range={filters.range}
              minPrice={filters.minPrice}
              amount={filters.amount}
              query={filters.query}
              sort={filters.sort}
              category={filters.category}
              onRange={(r) => patchFilters({ range: r })}
              onMinPrice={(m) => patchFilters({ minPrice: m })}
              onAmount={(a) => patchFilters({ amount: a })}
              onQuery={(q) => patchFilters({ query: q })}
              onSort={(s) => patchFilters({ sort: s })}
              onCategory={(c) => patchFilters({ category: c })}
            />

            <BondTable
              bonds={filtered}
              amount={filters.amount}
              sort={filters.sort}
              onSort={(s) => patchFilters({ sort: s })}
              visibleCount={visibleCount}
              onShowMore={() => setVisibleCount((c) => c + BOND_PAGE_SIZE)}
            />

            <div className="flex justify-start py-6">
              <button
                type="button"
                onClick={shareOnX}
                className="text-[13px] text-muted hover:text-ink"
              >
                Share on X
              </button>
            </div>
          </main>
        </>
      )}

      <Footer />
    </div>
  );
}

export type { Bond, BondsPayload };
