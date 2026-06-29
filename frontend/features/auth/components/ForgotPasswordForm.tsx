"use client";
import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import {
  forgotPasswordFormSchema,
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { Button, Card, Field, Input } from "@/components/UI";
import { IconArrow, IconMail } from "@/components/Icons";
import { useI18n } from "@/i18n";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    const result = validateForm(forgotPasswordFormSchema, { email });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(result.data.email);
      setSent(true);
    } catch (e) {
      const { message, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="p-6 sm:p-8">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold">{t("auth.forgot.checkEmail")}</h1>
          <p className="text-sm text-slate-500">
            {t("auth.forgot.sentTo")} <strong>{email}</strong>
          </p>
          <Link href="/login" className="text-electric-600 text-sm font-semibold hover:underline">
            {t("auth.forgot.backLogin")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">{t("auth.reset")}</h1>
      <p className="text-sm text-slate-500 mt-1">{t("auth.forgot.enterEmail")}</p>

      <div className="mt-6 space-y-4">
        {formError && <p className="text-sm text-rose-500">{formError}</p>}

        <Field label={t("auth.email")} error={fieldErrors.email}>
          <Input
            icon={<IconMail width={16} height={16} />}
            type="email"
            placeholder={t("auth.emailPh")}
            autoComplete="email"
            value={email}
            error={!!fieldErrors.email}
            onChange={(e) => {
              setEmail(e.target.value);
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

        <Button
          className="w-full"
          onClick={handleSubmit}
          icon={<IconArrow width={14} height={14} />}
          disabled={loading}
        >
          {loading ? t("auth.forgot.sending") : t("auth.sendReset")}
        </Button>

        <Link href="/login" className="block text-center text-sm text-electric-600 font-semibold hover:underline">
          {t("auth.forgot.backLogin")}
        </Link>
      </div>
    </Card>
  );
}
