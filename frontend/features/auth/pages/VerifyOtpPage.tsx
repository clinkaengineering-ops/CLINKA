"use client";

import { Suspense } from "react";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";

export function VerifyOtpPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
