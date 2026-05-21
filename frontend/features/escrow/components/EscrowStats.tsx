"use client";

import { StatCard } from "@/components/UI";
import {
  IconWallet,
  IconCheck,
  IconClock,
  IconAlert,
} from "@/components/Icons";
import { useI18n } from "@/i18n";
import { formatMoney } from "../utils/formatMoney";

export function EscrowStats({
  inEscrow,
  released,
  pending,
  refundCount,
}: {
  inEscrow: number;
  released: number;
  pending: number;
  refundCount: number;
}) {
  const { t } = useI18n();

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t("es.statIn")}
        value={formatMoney(inEscrow)}
        icon={<IconWallet width={20} height={20} />}
      />
      <StatCard
        label={t("es.statReleased")}
        value={formatMoney(released)}
        icon={<IconCheck width={20} height={20} />}
      />
      <StatCard
        label={t("es.statPending")}
        value={formatMoney(pending)}
        icon={<IconClock width={20} height={20} />}
      />
      <StatCard
        label={t("es.statRefund")}
        value={String(refundCount)}
        icon={<IconAlert width={20} height={20} />}
        change={refundCount === 0 ? t("es.allClear") : undefined}
      />
    </div>
  );
}
