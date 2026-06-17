"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { useMe } from "../../../auth/hooks/useMe";
import {
  useDashboardStats,
  useActiveProjects,
  useNotifications,
  useMessages,
} from "../hooks/useClientDashboard";
import { DashboardHeader } from "../components/DashboardHeader";
import { ClientProfile } from "../components/ClientProfile";
import { DashboardStatsRow } from "../components/DashboardStats";
import { DashboardActiveProjects } from "../components/DashboardActiveProjects";
import { DashboardQuickActions } from "../components/DashboardQuickActions";
import { DashboardEscrowOverview } from "../components/DashboardEscrowOverview";

export function ClientDashboardPage() {
  const router = useRouter();
  const { me, loading: meLoading, error } = useMe();
  const statsState = useDashboardStats();
  const projectsState = useActiveProjects();
  const notificationsState = useNotifications();
  const messagesState = useMessages(4);

  return (
    <div className="space-y-6">
      <DashboardHeader
        me={me}
        onNewProject={() => router.push("/projects?create=1")}
        onInviteTeam={() => router.push("/engineers")}
      />

      {statsState.error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 flex justify-between">
          <span>{statsState.error}</span>
          <Button size="sm" variant="ghost" onClick={() => statsState.refetch()}>
            Retry
          </Button>
        </div>
      )}

      {statsState.data && <DashboardStatsRow stats={statsState.data} />}

      <DashboardQuickActions
        messages={messagesState.data ?? []}
        notifications={notificationsState.data ?? []}
      />

      <DashboardEscrowOverview />

      <DashboardActiveProjects
        projects={projectsState.data ?? []}
        loading={projectsState.loading}
      />

      <ClientProfile me={me} loading={meLoading} error={error} />
    </div>
  );
}
