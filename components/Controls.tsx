"use client";

import {
  BOND_CATEGORIES,
  type CategoryFilter,
  type RangeFilter,
  type SortKey,
} from "@/lib/bonds";

const RANGES: { id: RangeFilter; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "Before Dec 31" },
];

const MIN_OPTIONS = [
  { value: 0.95, label: "95¢" },
  { value: 0.97, label: "97¢" },
];

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...BOND_CATEGORIES.map((c) => ({ id: c as CategoryFilter, label: c })),
];

export function Controls({
  range,
  minPrice,
  amount,
  query,
  sort,
  category,
  onRange,
  onMinPrice,
  onAmount,
  onQuery,
  onSort,
  onCategory,
}: {
  range: RangeFilter;
  minPrice: number;
  amount: number;
  query: string;
  sort: SortKey;
  category: CategoryFilter;
  onRange: (r: RangeFilter) => void;
  onMinPrice: (m: number) => void;
  onAmount: (a: number) => void;
  onQuery: (q: string) => void;
  onSort: (s: SortKey) => void;
  onCategory: (c: CategoryFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-hairline py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-end md:gap-6">
          <div
            role="tablist"
            aria-label="Time range"
            className="flex flex-wrap items-end gap-5"
          >
            {RANGES.map((tab) => {
              const active = tab.id === range;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onRange(tab.id)}
                  className={`relative pb-2 text-[14px] font-medium transition-colors ${
                    active ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <label className="flex flex-col gap-1 text-[12px] text-muted">
            Min price
            <select
              value={String(minPrice)}
              onChange={(e) => onMinPrice(Number(e.target.value))}
              className="h-9 border border-hairline bg-white px-2 font-mono-num text-[13px] text-ink"
            >
              {MIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[12px] text-muted md:max-w-[220px]">
            Search
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Filter markets"
              className="h-9 w-full border border-hairline bg-white px-3 text-[13px] text-ink placeholder:text-muted"
            />
          </label>

          <label className="flex flex-col gap-1 text-[12px] text-muted">
            Sort
            <select
              value={sort}
              onChange={(e) => onSort(e.target.value as SortKey)}
              className="h-9 border border-hairline bg-white px-2 font-mono-num text-[13px] text-ink"
            >
              <option value="apy">APY</option>
              <option value="return">Return</option>
              <option value="ends">Ends</option>
              <option value="liquidity">Liquidity</option>
            </select>
          </label>
        </div>

        <label className="flex items-center gap-2 text-[14px] text-ink">
          <span>If I put in $</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount.toLocaleString("en-US")}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              onAmount(raw ? Number(raw) : 0);
            }}
            aria-label="Investment amount in dollars"
            className="h-9 w-[7.5rem] border border-hairline bg-white px-2 text-right font-mono-num text-[14px] text-ink"
          />
        </label>
      </div>

      <div
        role="tablist"
        aria-label="Category"
        className="flex flex-wrap items-end gap-5"
      >
        {CATEGORIES.map((tab) => {
          const active = tab.id === category;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onCategory(tab.id)}
              className={`relative pb-2 text-[13px] font-medium transition-colors ${
                active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
