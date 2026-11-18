import { ImageResponse } from "next/og";
import {
  computeAggregates,
  fetchBonds,
  formatLiquidity,
  formatReturnPct,
} from "@/lib/bonds";

export const dynamic = "force-static";
export const alt = "PolyBonds — near-certain Polymarket predictions ending this year";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ALUMNI_SANS_BOLD =
  "https://cdn.jsdelivr.net/fontsource/fonts/alumni-sans@5.2.5/latin-700-normal.ttf";

export default async function OpenGraphImage() {
  const [payload, alumniSans] = await Promise.all([
    fetchBonds(),
    fetch(ALUMNI_SANS_BOLD).then((res) => {
      if (!res.ok) throw new Error(`Failed to load Alumni Sans (${res.status})`);
      return res.arrayBuffer();
    }),
  ]);
  const aggregates = computeAggregates(payload.bonds);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          color: "#0A0A0A",
          padding: "56px 64px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          <span>PolyBonds</span>
          <span style={{ color: "#6B7280", fontSize: 20, fontFamily: "ui-monospace, monospace" }}>
            before Dec 31
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 168,
              fontWeight: 700,
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
              fontFamily: "Alumni Sans",
            }}
          >
            {formatLiquidity(aggregates.totalLiquidity)}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 500,
              maxWidth: 780,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            sitting in near-certain Polymarket predictions that pay out before Dec 31.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#0A0A0A",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {aggregates.count.toLocaleString("en-US")} bonds ·{" "}
          {formatReturnPct(aggregates.avgReturn)} avg return
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Alumni Sans",
          data: alumniSans,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
