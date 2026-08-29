"use client";

import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoadingFallback } from "@/components/LoadingFallback";

export function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
