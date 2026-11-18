import { NextResponse } from "next/server";
import { fetchBonds } from "@/lib/bonds";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await fetchBonds();

  if (payload.error && payload.bonds.length === 0) {
    return NextResponse.json(
      {
        ...payload,
        error: "Polymarket data is temporarily unavailable",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(payload);
}
