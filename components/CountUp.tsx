"use client";

import { useEffect, useRef, useState } from "react";
import { formatLiquidity } from "@/lib/bonds";

export function CountUp({ value }: { value: number }) {
  const target = Number.isFinite(value) && value > 0 ? value : 0;
  const [display, setDisplay] = useState(target);
  const reducedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedRef.current = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
    }

    if (reducedRef.current || target <= 0) {
      setDisplay(target);
      return;
    }

    setDisplay(0);
    const duration = 600;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.max(0, target * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className="font-display tabular-nums" aria-label={formatLiquidity(target)}>
      {formatLiquidity(Math.max(0, display))}
    </span>
  );
}
