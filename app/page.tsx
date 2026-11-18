import { Suspense } from "react";
import { PolyBondsApp } from "@/components/PolyBondsApp";
import { fetchBonds } from "@/lib/bonds";

// Avoid baking a failed empty response forever; process cache keeps loads fast after the first pull.
export const dynamic = "force-dynamic";

function Fallback() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 md:px-6">
          <p className="text-[18px] font-semibold">PolyBonds</p>
          <div className="skeleton h-3 w-28" />
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6">
        <div className="skeleton h-[110px] w-[70%] max-w-md md:h-[180px]" />
        <div className="mt-8 space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-14 items-center border-b border-hairline"
            >
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const initial = await fetchBonds();

  return (
    <Suspense fallback={<Fallback />}>
      <PolyBondsApp initial={initial} />
    </Suspense>
  );
}
