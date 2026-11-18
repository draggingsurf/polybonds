"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CountUp } from "@/components/CountUp";
import {
  formatReturnPct,
  type BondAggregates,
} from "@/lib/bonds";

export function Hero({
  aggregates,
  year,
}: {
  aggregates: BondAggregates;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const next =
    aggregates.nextPays == null
      ? "—"
      : aggregates.nextPays === 1
        ? "next pays in 1 day"
        : `next pays in ${aggregates.nextPays} days`;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-10 md:gap-10 md:px-6 md:py-14">
        <p className="font-display text-[42px] leading-[0.95] tracking-[-0.03em] text-ink md:text-[72px]">
          put your idle capital to work
        </p>

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-end md:gap-8">
            <div ref={wrapRef} className="relative">
              <div className="flex items-start gap-2 md:gap-3">
                <p className="font-display text-[110px] leading-[0.85] tracking-[-0.04em] text-ink md:text-[200px]">
                  <CountUp value={aggregates.totalLiquidity} />
                </p>
                <button
                  type="button"
                  aria-label="How this total is calculated"
                  aria-expanded={open}
                  aria-controls={tipId}
                  onClick={() => setOpen((v) => !v)}
                  className="mt-3 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hairline text-[12px] font-medium text-muted transition-colors hover:border-ink hover:text-ink md:mt-6 md:h-7 md:w-7 md:text-[13px]"
                >
                  i
                </button>
              </div>

              {open && (
                <div
                  id={tipId}
                  role="dialog"
                  className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(100vw-2rem,320px)] border border-hairline bg-white p-4 shadow-none"
                >
                  <p className="text-[13px] font-medium text-ink">How this is calculated</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted">
                    Sum of order-book liquidity across every listed bond in the
                    current filters — open binary markets priced 95¢–99.5¢ that
                    pay out by Dec 31 {year} (sports, esports, weather, and
                    crypto price markets excluded). It is capital sitting in those
                    books, not your personal profit.
                  </p>
                </div>
              )}
            </div>

            <p className="max-w-[22rem] pb-1 text-[22px] font-medium leading-tight tracking-[-0.02em] text-ink md:max-w-[28rem] md:text-[32px]">
              sitting in near-certain Polymarket predictions that pay out before
              Dec 31.
            </p>
          </div>

          <dl className="font-mono-num shrink-0 space-y-1 text-[13px] leading-relaxed text-ink md:pb-2 md:text-right md:text-[14px]">
            <div>
              <dt className="sr-only">Bond count</dt>
              <dd>
                {aggregates.count.toLocaleString("en-US")} bonds
                <span className="sr-only"> ending by Dec 31 {year}</span>
              </dd>
            </div>
            <div>
              <dt className="sr-only">Average return</dt>
              <dd>{formatReturnPct(aggregates.avgReturn)} avg return</dd>
            </div>
            <div>
              <dt className="sr-only">Next payout</dt>
              <dd>{next}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
