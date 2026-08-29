"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { Button, Card, Field, Input } from "@/components/UI";
import { IconMail, IconSend } from "@/components/Icons";
import { useI18n } from "@/i18n";
import {
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import useAuthStore from "@/store/authStore";
import {
  fetchSupportContact,
  submitSupportTicket,
} from "../api/support.api";

const supportFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

export function HelpCenterPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [supportEmail, setSupportEmail] = useState("support@clinka.com");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchSupportContact()
      .then((c) => setSupportEmail(c.email))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  async function handleSubmit() {
    const result = validateForm(supportFormSchema, {
      name,
      email,
      subject,
      message,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await submitSupportTicket(result.data);
      setSent(true);
    } catch (e) {
      const { message: msg, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        <Card className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold">{t("help.sentTitle")}</h1>
          <p className="text-sm text-slate-500">{t("help.sentDesc")}</p>
          <Link href="/" className="inline-block text-brand-teal text-sm font-semibold hover:underline">
            {t("help.backHome")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-2xl min-w-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{t("help.title")}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{t("help.subtitle")}</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold">{t("help.formTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("help.formDesc")}</p>
          </div>

          {formError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
              {formError}
            </div>
          )}

          <Field label={t("help.name")} error={fieldErrors.name}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("help.name")}
            />
          </Field>
          <Field label={t("auth.email")} error={fieldErrors.email}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
            />
          </Field>
          <Field label={t("help.subject")} error={fieldErrors.subject}>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("help.subjectPlaceholder")}
            />
          </Field>
          <Field label={t("help.message")} error={fieldErrors.message}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={t("help.messagePlaceholder")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
          </Field>
          <Button
            disabled={loading}
            onClick={handleSubmit}
            icon={<IconSend width={16} height={16} />}
          >
            {loading ? t("common.loading") : t("help.submit")}
          </Button>
        </Card>

        <Card className="p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
              <IconMail width={22} height={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t("help.emailTitle")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("help.emailDesc")}</p>
            </div>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-block text-brand-teal font-semibold hover:underline break-all"
            >
              {supportEmail}
            </a>
          </div>
          <a
            href={`mailto:${supportEmail}`}
            className="mt-8 inline-flex items-center justify-center gap-2 h-10 px-4 text-sm rounded-lg font-medium transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <IconMail width={16} height={16} />
            {t("help.emailCta")}
          </a>
        </Card>
      </div>
    </div>
  );
}
