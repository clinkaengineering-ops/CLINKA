"use client";

import { Button } from "@/components/UI";
import { IconShield } from "@/components/Icons";
import { useI18n } from "@/i18n";

interface Props {
  onExport: () => void;
  exportDisabled?: boolean;
}

export function AdminHeader({ onExport, exportDisabled }: Props) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <IconShield width={14} height={14} className="text-electric-500" />
          Admin Console
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{t("ad.title")}</h1>
      </div>
      <Button variant="secondary" onClick={onExport} disabled={exportDisabled}>
        {t("common.exportCsv")}
      </Button>
    </div>
  );
}
