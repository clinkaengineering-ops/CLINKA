import { Suspense } from "react";
import CheckoutClient from "@/features/escrow/pages/CheckoutClient";
import { LoadingFallback } from "@/components/LoadingFallback";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center">
          <LoadingFallback className="text-slate-400 text-sm" />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
