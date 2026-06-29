"use client";

import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
