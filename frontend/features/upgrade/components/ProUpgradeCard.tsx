"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { useI18n } from "@/i18n";

/** Sidebar CTA for CLINKA Pro — enable via `featureFlags.proUpgrade`. */
export function ProUpgradeCard() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 dark:from-electric-600/20 dark:to-navy-900 text-white relative overflow-hidden">
      <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-electric-500/20 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-wider text-electric-300">
        {t("side.proTitle")}
      </p>
      <p className="mt-1 text-sm font-semibold">{t("side.proDesc")}</p>
      <Button
        size="sm"
        className="mt-3 w-full"
        onClick={() => router.push("/settings")}
      >
        {t("side.upgrade")}
      </Button>
    </div>
  );
}
