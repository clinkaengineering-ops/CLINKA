"use client";

import { Button } from "@/components/UI";
import { useI18n } from "@/i18n";

export function FawryCodeModal({
  open,
  code,
  expireDate,
  onClose,
}: {
  open: boolean;
  code: string;
  expireDate?: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-xl">
        <h3 className="text-lg font-bold">{t("es.fawryTitle")}</h3>
        <p className="text-sm text-slate-500 mt-2">{t("es.fawryDesc")}</p>
        <p className="mt-4 text-3xl font-mono font-bold tracking-widest text-electric-600 dark:text-electric-400">
          {code}
        </p>
        {expireDate && (
          <p className="text-xs text-slate-500 mt-2">
            {t("es.fawryExpires")}: {expireDate}
          </p>
        )}
        <Button className="mt-6 w-full" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </div>
  );
}
