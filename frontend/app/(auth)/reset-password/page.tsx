"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, Input } from "@/components/UI";
import { authApi } from "@/features/auth/api/auth.api";
import {
  parseApiValidation,
  resetPasswordFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setFormError("Invalid or missing reset link. Request a new reset email.");
      return;
    }
    const result = validateForm(resetPasswordFormSchema, { password, confirm });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: result.data.password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const { message, errors } = parseApiValidation(err);
      setFieldErrors(errors);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        {done ? (
          <p className="mt-4 text-sm text-emerald-600">
            Password updated. Redirecting to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && <p className="text-sm text-rose-500">{formError}</p>}

            <Field label="New password" error={fieldErrors.password}>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                error={!!fieldErrors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Confirm password" error={fieldErrors.confirm}>
              <Input
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                value={confirm}
                error={!!fieldErrors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
        <Link href="/login" className="inline-block mt-4 text-sm text-electric-600 hover:underline">
          Back to login
        </Link>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
