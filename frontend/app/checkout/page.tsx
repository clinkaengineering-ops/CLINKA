import { Suspense } from "react";
import CheckoutClient from "@/features/escrow/pages/CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-950 flex items-center justify-center text-slate-400 text-sm">
          Loading…
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
