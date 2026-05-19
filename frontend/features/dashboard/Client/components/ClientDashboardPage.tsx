// features/client/components/ClientDashboardPage.tsx
// Owns the single useMe() call for this page.
// Passes me, loading, error, update down to child components as props —
// no child re-fetches independently.
"use client";
import { useRouter } from "next/navigation";
import { useMe } from "@/features/users/hooks/useMe";
import { DashboardHeader } from "./DashboardHeader";
import { ClientProfile } from "./ClientProfile";

export function ClientDashboardPage() {
  const router = useRouter();
  const { me, loading, error, update } = useMe();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <DashboardHeader
        me={me}
        onNewProject={() => router.push("/projects/new")}
        onInviteTeam={() => router.push("/settings/team")}
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
