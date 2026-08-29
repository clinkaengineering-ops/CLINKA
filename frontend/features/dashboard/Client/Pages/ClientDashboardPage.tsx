"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { useI18n } from "@/i18n";
import { useMe } from "../../../auth/hooks/useMe";
import {
  useDashboardStats,
  useActiveProjects,
  useNotifications,
  useMessages,
} from "../hooks/useClientDashboard";
import { DashboardHeader } from "../components/DashboardHeader";
import { DashboardStatsRow } from "../components/DashboardStats";
import { DashboardActiveProjects } from "../components/DashboardActiveProjects";
import { DashboardQuickActions } from "../components/DashboardQuickActions";
import { ClientDashboardAnalytics } from "../components/ClientDashboardAnalytics";

export function ClientDashboardPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { me } = useMe();
  const statsState = useDashboardStats();
  const projectsState = useActiveProjects();
  const notificationsState = useNotifications();
  const messagesState = useMessages(4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        me={me}
        onNewProject={() => router.push("/projects?create=1")}
        onInviteTeam={() => router.push("/engineers")}
      />

      {statsState.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 flex justify-between">
          <span>{statsState.error}</span>
          <Button size="sm" variant="ghost" onClick={() => statsState.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {statsState.data && <DashboardStatsRow stats={statsState.data} />}

      <ClientDashboardAnalytics />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DashboardActiveProjects
            projects={projectsState.data ?? []}
            loading={projectsState.loading}
          />
        </div>
        <DashboardQuickActions
          messages={messagesState.data ?? []}
          notifications={notificationsState.data ?? []}
        />
      </div>
    </div>
  );
}
