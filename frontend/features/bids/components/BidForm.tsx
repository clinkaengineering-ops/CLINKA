"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Project } from "../../projects/api/project.api";
import {
  createBidFormSchema,
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { createBid } from "../api/bids.api";
import useAuthStore from "@/store/authStore";
import { useMe } from "@/features/auth/hooks/useMe";

interface BidFormProps {
  project: Project;
  onSubmitted?: () => void;
}

export function BidForm({ project, onSubmitted }: BidFormProps) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { me } = useMe();
  const verification = me?.profile?.verificationStatus ?? "PENDING";
  const [price, setPrice] = useState(project.budget.toString());
  const [weeks, setWeeks] = useState("8");
  const [cover, setCover] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const net = useMemo(() => {
    const p = parseFloat(price) || 0;
    return (p * 0.92).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [price]);

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          {t("bid.signInEngineer")}
        </p>
        <Link href={`/login?next=/projects`}>
          <Button className="mt-3 w-full" size="sm">
            {t("auth.signin")}
          </Button>
        </Link>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        {t("bid.adminNoBid")}
      </p>
    );
  }

  if (user.role !== "ENGINEER") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        {t("bid.clientNoBid")}
      </p>
    );
  }

  if (project.status !== "OPEN") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        {t("bid.closed")}
      </p>
    );
  }

  if (verification !== "APPROVED") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
        <p className="font-semibold">{t("bid.verificationRequired")}</p>
        <p className="mt-1">
          {t("bid.verificationPending")} {verification}
        </p>
        <Link href="/settings" className="inline-block mt-3">
          <Button size="sm" variant="secondary">
            {t("st.title")}
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    const result = validateForm(createBidFormSchema, {
      price,
      weeks,
      description: cover,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    try {
      const duration =
        result.data.weeks === 1 ? "1 week" : `${result.data.weeks} weeks`;
      await createBid(project.id, {
        price: result.data.price,
        duration,
        description: result.data.description,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: unknown) {
      const { message, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          ✓ {t("bid.success")}
        </p>
        <p className="mt-1 text-xs text-slate-500">{t("bid.clientNotified")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-electric-500/30 bg-electric-500/5 p-4">
      <p className="text-sm font-bold">{t("pm.bidTitle")}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            {t("pm.yourPrice")}
          </label>
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={`mt-1 w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.price
                ? "border-rose-500 focus:ring-rose-500/30"
                : "border-slate-200 dark:border-slate-700 focus:ring-electric-500/30"
            }`}
          />
          {fieldErrors.price && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.price}</p>
          )}
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            {t("pm.deliveryWeeks")}
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className={`mt-1 w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 ${
              fieldErrors.weeks
                ? "border-rose-500 focus:ring-rose-500/30"
                : "border-slate-200 dark:border-slate-700 focus:ring-electric-500/30"
            }`}
          />
          {fieldErrors.weeks && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.weeks}</p>
          )}
        </div>
      </div>

      <textarea
        placeholder={t("pm.coverLetter")}
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        rows={3}
        className={`mt-3 w-full rounded-lg border bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 ${
          fieldErrors.description
            ? "border-rose-500 focus:ring-rose-500/30"
            : "border-slate-200 dark:border-slate-700 focus:ring-electric-500/30"
        }`}
      />
      {fieldErrors.description && (
        <p className="mt-1 text-xs text-rose-500">{fieldErrors.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {t("pm.serviceFee")}{" "}
          <span className="font-bold text-slate-900 dark:text-white">${net}</span>
        </span>
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      <Button
        className="mt-3 w-full"
        icon={<IconArrow width={14} height={14} />}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? t("bid.submitting") : t("pm.submitBid")}
      </Button>
    </div>
  );
}
