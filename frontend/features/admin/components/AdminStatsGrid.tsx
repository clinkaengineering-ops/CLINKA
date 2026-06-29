"use client";

import { StatCard } from "@/components/UI";
import { IconUsers, IconWallet, IconShield, IconAlert } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { AdminStats } from "../api/admin.api";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  stats: AdminStats;
}

export function AdminStatsGrid({ stats }: Props) {
  const { t } = useI18n();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t("ad.totalUsers")}
        value={stats.totalUsers.toLocaleString()}
        icon={<IconUsers width={20} height={20} />}
      />
      <StatCard
        label={t("ad.gmv")}
        value={formatMoney(stats.gmv)}
        icon={<IconWallet width={20} height={20} />}
      />
      <StatCard
        label={t("ad.verifPending")}
        value={String(stats.pendingVerifications)}
        icon={<IconShield width={20} height={20} />}
      />
      <StatCard
        label={t("ad.supportOpen")}
        value={String(stats.openSupportTickets)}
        icon={<IconAlert width={20} height={20} />}
      />
    </div>
  );
}
