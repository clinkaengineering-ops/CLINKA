"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Project } from "../../projects/api/project.api";
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

  const net = useMemo(() => {
    const p = parseFloat(price) || 0;
    return (p * 0.92).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [price]);

  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center text-sm">
        <p className="text-slate-600 dark:text-slate-400">
          Sign in as an engineer to place a bid.
        </p>
        <Link href={`/login?next=/projects`}>
          <Button className="mt-3 w-full" size="sm">
            Sign in
          </Button>
        </Link>
      </div>
    );
  }

  if (user.role === "ADMIN") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        Admin accounts can browse projects but cannot place bids.
      </p>
    );
  }

  if (user.role !== "ENGINEER") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        Only engineers can submit bids on open projects.
      </p>
    );
  }

  if (project.status !== "OPEN") {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        Bidding is closed for this project.
      </p>
    );
  }

  if (verification !== "APPROVED") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
        <p className="font-semibold">Verification required</p>
        <p className="mt-1">
          Your account must be approved by CLINKA before you can bid. Status:{" "}
          {verification}
        </p>
        <Link href="/settings" className="inline-block mt-3">
          <Button size="sm" variant="secondary">
            Settings
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createBid(project.id, {
        price: parseFloat(price),
        duration: `${weeks} weeks`,
        description: cover,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(
        err?.response?.data?.message ?? err?.message ?? "Failed to submit bid",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          ✓ Bid submitted successfully!
        </p>
        <p className="mt-1 text-xs text-slate-500">The client will be notified.</p>
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            {t("pm.deliveryWeeks")}
          </label>
          <input
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
      </div>

      <textarea
        placeholder={t("pm.coverLetter")}
        value={cover}
        onChange={(e) => setCover(e.target.value)}
        rows={3}
        className="mt-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
      />

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
        disabled={submitting || !price || !cover}
      >
        {submitting ? "Submitting…" : t("pm.submitBid")}
      </Button>
    </div>
  );
}
