"use client";

import { useLoadingStore } from "@/store/loadingStore";
import { useI18n } from "@/i18n";

export function GlobalUploadIndicator() {
  const isUploading = useLoadingStore((s) => s.isUploading);
  const { t } = useI18n();

  if (!isUploading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-scale-in">
        <div className="w-10 h-10 border-4 border-electric-500/30 border-t-electric-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("common.uploading")}
        </p>
      </div>
    </div>
  );
}
