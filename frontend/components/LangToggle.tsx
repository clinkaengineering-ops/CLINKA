"use client";

import { useI18n, type Lang } from "@/i18n";
import { cn } from "@/utils/cn";

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();

  const next: Lang = lang === "en" ? "ar" : "en";
  const label = lang === "en" ? "العربية" : "English";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border font-semibold transition-colors",
        "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-electric-500/40",
        "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:border-electric-500/30",
        "focus:outline-none focus:ring-2 focus:ring-electric-500/40",
        compact ? "h-10 min-w-10 px-2 text-xs" : "h-10 gap-1.5 px-3 text-xs",
      )}
      aria-label={t("common.language")}
      title={t("common.language")}
    >
      <span className="uppercase tracking-wide">{lang === "en" ? "EN" : "AR"}</span>
      {!compact && <span className="text-slate-500 dark:text-slate-400">→ {label}</span>}
    </button>
  );
}
