"use client";

import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
