"use client";

import {  useMemo, useState } from "react";
import {  Button } from "../../../components/UI";
import {
  IconArrow,
} from "../../../components/Icons";
import { useI18n } from "../../../i18n";
import type { Project } from "../../projects/api/project.api";




interface BidFormProps {
  project: Project;
}

export function BidForm({ project }: BidFormProps) {
  const { t } = useI18n();
  const [price, setPrice] = useState(project.budget.toString());
  const [weeks, setWeeks] = useState("8");
  const [cover, setCover] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const net = useMemo(() => {
    const p = parseFloat(price) || 0;
    return (p * 0.92).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [price]);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Wire to your bid API endpoint here
    await new Promise(r => setTimeout(r, 800)); // placeholder
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          ✓ Bid submitted successfully!
        </p>
        <p className="mt-1 text-xs text-slate-500">The client will be notified.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs text-electric-600 underline"
        >
          Edit bid
        </button>
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
            onChange={e => setPrice(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            {t("pm.deliveryWeeks")}
          </label>
          <input
            value={weeks}
            onChange={e => setWeeks(e.target.value)}
            className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
      </div>

      <textarea
        placeholder={t("pm.coverLetter")}
        value={cover}
        onChange={e => setCover(e.target.value)}
        rows={3}
        className="mt-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
      />

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {t("pm.serviceFee")}{" "}
          <span className="font-bold text-slate-900 dark:text-white">${net}</span>
        </span>
      </div>

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
