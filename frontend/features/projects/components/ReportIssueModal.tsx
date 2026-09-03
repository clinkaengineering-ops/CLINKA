"use client";

import { useState } from "react";
import { Button, Field, Input } from "@/components/UI";
import { useI18n } from "@/i18n";

export function ReportIssueModal({
  open,
  onClose,
  projectTitle,
  loading,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  loading: boolean;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(t("dispute.reasonRequired"));
      return;
    }
    
    setError(null);
    try {
      await onSubmit(reason);
      setReason(""); // Reset on success
    } catch (err: any) {
      setError(err.message || "Failed to open dispute");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" style={{ direction: (typeof document !== 'undefined' ? document.documentElement.dir : 'ltr') as "ltr" | "rtl" | undefined }}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {t("dispute.reportIssueModalTitle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {t("dispute.reportIssueModalDesc")}
          </p>
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase">Project</span>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{projectTitle}</div>
          </div>

          <form id="report-issue-form" onSubmit={handleSubmit} className="space-y-4">
            <Field
              label={t("common.description")}
              error={error || undefined}
            >
              <textarea
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm focus:border-electric-500 focus:ring-1 focus:ring-electric-500 min-h-[100px] resize-y text-slate-900 dark:text-white"
                placeholder={t("dispute.reasonPlaceholder")}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
              />
            </Field>
          </form>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="report-issue-form"
            className="!bg-rose-600 hover:!bg-rose-700 !text-white"
            disabled={loading || !reason.trim()}
          >
            {loading ? "..." : t("dispute.submit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
