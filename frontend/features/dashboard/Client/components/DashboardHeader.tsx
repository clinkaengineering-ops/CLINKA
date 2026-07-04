// features/client/components/DashboardHeader.tsx
// Receives `me` as a prop — does NOT fetch independently.
// Me type comes from @/types (single source of truth).
import { Button } from "@/components/UI";
import { IconBriefcase, IconUsers } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Me } from "@/types";

interface Props {
  me: Me | null;
  onNewProject: () => void;
  onInviteTeam: () => void;
}

export function DashboardHeader({ me, onNewProject, onInviteTeam }: Props) {
  const { t } = useI18n();

  // Graceful fallback while me is loading (parent shows skeleton or passes null)
  const firstName = me?.name?.split(" ")[0] ?? "…";

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">
          {t("cd.welcomeNamed").replace("{name}", firstName)}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{t("cd.title")}</h1>
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          icon={<IconUsers width={16} height={16} />}
          onClick={onInviteTeam}
        >
          {t("common.invite")}
        </Button>
        <Button
          icon={<IconBriefcase width={16} height={16} />}
          onClick={onNewProject}
        >
          {t("cd.newProject")}
        </Button>
      </div>
    </div>
  );
}
