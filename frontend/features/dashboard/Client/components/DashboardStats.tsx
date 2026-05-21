"use client";

import { StatCard } from "@/components/UI";
import { IconBriefcase, IconWallet, IconUsers, IconClock } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { DashboardStats } from "@/types";

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const { t } = useI18n();
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t("cd.activeProjects")}
        value={String(stats.activeProjects)}
        change={stats.activeProjectsChange}
        icon={<IconBriefcase width={20} height={20} />}
      />
      <StatCard
        label={t("cd.inEscrow")}
        value={stats.inEscrow}
        change={stats.inEscrowChange}
        icon={<IconWallet width={20} height={20} />}
      />
      <StatCard
        label={t("cd.engineersHired")}
        value={String(stats.engineersHired)}
        change={stats.engineersHiredChange}
        icon={<IconUsers width={20} height={20} />}
      />
      <StatCard
        label={t("cd.avgDelivery")}
        value={stats.avgDeliveryDays ? `${stats.avgDeliveryDays}d` : "—"}
        change={stats.avgDeliveryChange}
        icon={<IconClock width={20} height={20} />}
      />
    </div>
  );
}
