import { Suspense } from "react";
import { EscrowPage } from "@/features/escrow/pages/EscrowPage";

function EscrowFallback() {
  return (
    <div className="max-w-7xl mx-auto p-12 text-center text-slate-500">
      Loading…
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<EscrowFallback />}>
      <EscrowPage />
    </Suspense>
  );
}
