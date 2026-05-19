"use client";
import { useRouter } from "next/navigation";
import { useMe } from "../../../auth/hooks/useMe";
import { DashboardHeader } from "../components/DashboardHeader";
import { ClientProfile } from "../components/ClientProfile";

export function ClientDashboardPage() {
  const router = useRouter();
  const { me, loading, error, update } = useMe();

  return (
    <div>
      <DashboardHeader
        me={me}
        onNewProject={() => router.push("/projects?create=1")}
        onInviteTeam={() => router.push("/settings")}
      />
      <ClientProfile
        me={me}
        loading={loading}
        error={error}
        onUpdate={update}
      />
    </div>
  );
}
