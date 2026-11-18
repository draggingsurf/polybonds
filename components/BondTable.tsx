"use client";

import {
  formatApy,
  formatCents,
  formatEnds,
  formatProfit,
  profit,
  withReferral,
  type Bond,
  type SortKey,
} from "@/lib/bonds";

const PAGE_SIZE = 50;

function SortHeader({
  label,
  column,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey | null;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  align?: "left" | "right";
}) {
  if (!column) {
    return (
      <th
        scope="col"
        className={`px-2 py-3 text-[12px] font-medium text-muted ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        {label}
      </th>
    );
  }

  const active = sort === column;
  return (
    <th
      scope="col"
      aria-sort={active ? "descending" : "none"}
      className={`px-2 py-3 text-[12px] font-medium ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 ${
          active ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        {label}
        {active && <span aria-hidden>↓</span>}
      </button>
    </th>
  );
}

export function BondTable({
  bonds,
  amount,
  sort,
  onSort,
  visibleCount,
  onShowMore,
}: {
  bonds: Bond[];
  amount: number;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  visibleCount: number;
  onShowMore: () => void;
}) {
  const now = new Date();
  const visible = bonds.slice(0, visibleCount);
  const hasMore = bonds.length > visibleCount;

  if (bonds.length === 0) {
    return (
      <p className="py-16 text-center text-[14px] text-muted">
        No bonds match. Try a lower min price or a longer range.
      </p>
    );
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <SortHeader label="Market" column={null} sort={sort} onSort={onSort} />
              <SortHeader label="Side" column={null} sort={sort} onSort={onSort} />
              <th
                scope="col"
                className="px-2 py-3 text-right text-[12px] font-medium text-muted"
              >
                Price
              </th>
              <SortHeader
                label="You make"
                column="return"
                sort={sort}
                onSort={onSort}
                align="right"
              />
              <SortHeader
                label="Ends"
                column="ends"
                sort={sort}
                onSort={onSort}
                align="right"
              />
              <SortHeader
                label="APY"
                column="apy"
                sort={sort}
                onSort={onSort}
                align="right"
              />
              <th
                scope="col"
                className="px-2 py-3 text-right text-[12px] font-medium text-muted"
              >
                Trade
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((bond) => {
              const end = new Date(bond.endDate);
              return (
                <tr
                  key={bond.id}
                  className="border-b border-hairline transition-colors hover:bg-row-hover"
                >
                  <td className="max-w-[420px] truncate px-2 py-[18px] text-[14px] font-medium text-ink">
                    <span title={bond.question}>{bond.question}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] font-mono-num text-[13px] text-ink">
                    {bond.side}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] text-right font-mono-num text-[13px] text-ink">
                    {formatCents(bond.buyPrice)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] text-right font-mono-num text-[13px] text-profit">
                    {formatProfit(profit(amount, bond.returnPct))}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] text-right font-mono-num text-[13px] text-ink">
                    {formatEnds(bond.daysLeft, end, now)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] text-right font-mono-num text-[13px] text-ink">
                    {formatApy(bond.apy)}
                  </td>
                  <td className="whitespace-nowrap px-2 py-[18px] text-right text-[13px]">
                    <a
                      href={withReferral(bond.tradeUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      Trade
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <ul className="md:hidden">
        {visible.map((bond) => {
          const end = new Date(bond.endDate);
          return (
            <li
              key={bond.id}
              className="border-b border-hairline py-4 hover:bg-row-hover"
            >
              <p className="truncate text-[14px] font-medium text-ink" title={bond.question}>
                {bond.question}
              </p>
              <p className="mt-2 font-mono-num text-[12px] leading-relaxed text-ink">
                <span>{bond.side}</span>
                <span className="text-muted"> · </span>
                <span>{formatCents(bond.buyPrice)}</span>
                <span className="text-muted"> · </span>
                <span className="text-profit">
                  {formatProfit(profit(amount, bond.returnPct))}
                </span>
                <span className="text-muted"> · </span>
                <span>{formatEnds(bond.daysLeft, end, now)}</span>
                <span className="text-muted"> · </span>
                <span>{formatApy(bond.apy)} APY</span>
                <span className="text-muted"> · </span>
                <a
                  href={withReferral(bond.tradeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent"
                >
                  Trade
                </a>
              </p>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            type="button"
            onClick={onShowMore}
            className="text-[14px] font-medium text-accent hover:underline"
          >
            Show more ({Math.min(PAGE_SIZE, bonds.length - visibleCount)} of{" "}
            {bonds.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

export { PAGE_SIZE as BOND_PAGE_SIZE };
