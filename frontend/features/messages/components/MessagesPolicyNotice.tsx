"use client";

import { IconShield } from "@/components/Icons";
import { useI18n } from "@/i18n";

export function MessagesPolicyNotice() {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <IconShield width={16} height={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t("msg.rules.title")}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">
            {t("msg.rules.body")}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-amber-800/70 dark:text-amber-200/70">
            {t("msg.rules.banNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
