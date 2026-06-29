"use client";

import { Suspense } from "react";
import { VerifyOtpForm } from "@/features/auth/components/VerifyOtpForm";
import { LoadingFallback } from "@/components/LoadingFallback";

export function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyOtpForm />
    </Suspense>
  );
}
