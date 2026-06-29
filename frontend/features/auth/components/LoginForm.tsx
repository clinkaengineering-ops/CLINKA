"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { startGoogleSignIn } from "@/features/auth/lib/googleAuth";
import {
  loginFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { Button, Card, Divider, Field, Input } from "@/components/UI";
import { IconArrow, IconLock, IconMail, IconEye } from "@/components/Icons";
import { useI18n } from "@/i18n";

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const { login, loading, error } = useLogin();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  function handleGoogleSignIn() {
    const next = searchParams.get("next");
    startGoogleSignIn({
      role: "CLIENT",
      ...(next ? { next } : {}),
    });
  }

  async function handleSubmit() {
    const result = validateForm(loginFormSchema, form);
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    await login(result.data.email, result.data.password);
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.welcome")}</h1>
      <p className="text-sm text-slate-500 mt-1">{t("auth.signinSubShort")}</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {fieldErrors._form && (
          <p className="text-sm text-rose-500">{fieldErrors._form}</p>
        )}

        <Field label={t("auth.email")} error={fieldErrors.email}>
          <Input
            icon={<IconMail width={16} height={16} />}
            type="email"
            placeholder={t("auth.emailPh")}
            autoComplete="email"
            value={form.email}
            error={!!fieldErrors.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }
            }}
          />
        </Field>

        <Field
          label={t("auth.password")}
          error={fieldErrors.password}
          right={
            <Link
              href="/forgot-password"
              className="text-xs text-electric-600 hover:text-electric-500 font-medium"
            >
              {t("auth.forgotPassword")}
            </Link>
          }
        >
          <div className="relative">
            <Input
              icon={<IconLock width={16} height={16} />}
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPh")}
              autoComplete="current-password"
              value={form.password}
              error={!!fieldErrors.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }
              }}
            />
            <IconEye
              width={16}
              height={16}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </div>
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-electric-500"
            defaultChecked
          />
          {t("auth.keep")}
        </label>

        <Button
          className="w-full"
          onClick={handleSubmit}
          icon={<IconArrow width={14} height={14} />}
          disabled={loading}
        >
          {loading ? t("auth.signingIn") : t("auth.signin")}
        </Button>

        <Divider label={t("common.or")} />

        <div className="grid grid-cols-1 gap-3">
          <Button
            type="button"
            variant="secondary"
            className="!h-11 w-full"
            icon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
          >
            {t("auth.google")}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500">
          {t("auth.noAccount")}{" "}
          <Link
            href="/register"
            className="text-electric-600 font-semibold hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </p>
      </div>
    </Card>
  );
}
