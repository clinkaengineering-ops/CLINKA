"use client";

import { useI18n } from "@/i18n";

export function LoadingFallback({
  className = "text-sm text-slate-500",
}: {
  className?: string;
}) {
  const { t } = useI18n();
  return <p className={className}>{t("common.loading")}</p>;
}
