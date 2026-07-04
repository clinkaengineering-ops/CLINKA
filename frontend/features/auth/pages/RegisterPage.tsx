"use client";

import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { LoadingFallback } from "@/components/LoadingFallback";

export function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center">
          <LoadingFallback />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
