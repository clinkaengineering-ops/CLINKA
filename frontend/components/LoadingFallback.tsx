"use client";

import { useI18n } from "@/i18n";
import { Spinner } from "@/components/UI";
import { cn } from "@/utils/cn";

export function LoadingFallback({
  className,
}: {
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 animate-fade-in",
        className,
      )}
    >
      <Spinner size="md" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
    </div>
  );
}
