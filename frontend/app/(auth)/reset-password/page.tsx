"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Field, Input } from "@/components/UI";
import { PasswordInput as ActualPasswordInput } from "@/components/PasswordInput";
import { PasswordChecklist } from "@/components/PasswordChecklist";
import { authApi } from "@/features/auth/api/auth.api";
import {
  parseApiValidation,
  resetPasswordFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { useI18n } from "@/i18n";
import { LoadingFallback } from "@/components/LoadingFallback";

function ResetPasswordForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passFocus, setPassFocus] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setFormError(t("auth.reset.invalidLink"));
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
        <h1 className="text-2xl font-bold">{t("auth.reset")}</h1>
        {done ? (
          <p className="mt-4 text-sm text-emerald-600">{t("auth.reset.success")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {formError && <p className="text-sm text-rose-500">{formError}</p>}

            <Field label={t("auth.reset.newPassword")} error={fieldErrors.password}>
              <ActualPasswordInput 
                placeholder={t("auth.passMin")}
                autoComplete="new-password"
                value={password}
                error={!!fieldErrors.password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
              />
              {(passFocus || password.length > 0) ? (
                <PasswordChecklist password={password} confirmPassword={confirm} />
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  {t("auth.passReq.helper")}
                </p>
              )}
            </Field>
            <Field label={t("auth.reset.confirmPassword")} error={fieldErrors.confirm}>
              <ActualPasswordInput 
                placeholder={t("auth.reset.confirmPh")}
                autoComplete="new-password"
                value={confirm}
                error={!!fieldErrors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.reset.updating") : t("auth.reset.submit")}
            </Button>
          </form>
        )}
        <Link href="/login" className="inline-block mt-4 text-sm text-electric-600 hover:underline">
          {t("auth.forgot.backLogin")}
        </Link>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback className="p-8 text-center text-slate-500" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
