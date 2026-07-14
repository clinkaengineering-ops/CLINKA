"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/UI";
import { IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import type { Project, ServiceType } from "../api/project.api";
import { BidForm } from "@/features/bids/components/BidForm";
import { ProjectBidsList } from "./ProjectBidsList";
import { ProjectPaymentCard } from "./ProjectPaymentCard";
import { ProjectReviewSection } from "@/features/reviews/components/ProjectReviewSection";
import { ProjectInvitationsPanel } from "./ProjectInvitationsPanel";
import { STATUS_LABEL_KEYS } from "../utils/projectStatus";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  DESIGN: "Design",
  SUPERVISION: "Supervision",
  REVIEW: "Review",
};

interface ProjectDetailPanelProps {
  project: Project | null;
  loading: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function ProjectDetailPanel({
  project,
  loading,
  error,
  onRefresh,
}: ProjectDetailPanelProps) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  if (loading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="h-44 bg-slate-200 dark:bg-slate-800" />
        <div className="p-5 space-y-3">
          <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </Card>
    );
  }

  if (error || !project) {
    return (
      <Card className="p-8 text-center text-slate-500">
        <p className="font-semibold text-rose-500">Failed to load project details</p>
        {error && <p className="mt-1 text-sm">{error}</p>}
        {!error && <p className="mt-1 text-sm">Please select a project.</p>}
      </Card>
    );
  }

  const label = SERVICE_TYPE_LABELS[project.serviceType] ?? project.serviceType;
  const bidCount = project._count?.bids ?? project.bids?.length ?? 0;
  const isOwner = user?.id === project.clientId;

  return (
    <Card className="overflow-hidden">
      <div className="p-5 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
        <Badge className="!bg-white/10 !text-white !border-white/20">{label}</Badge>
        <h3 className="mt-3 text-xl font-bold">{project.title}</h3>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-white/10 p-2.5">
            <p className="text-white/60 text-[10px] uppercase">{t("common.budget")}</p>
            <p className="font-bold mt-0.5">{formatMoney(project.budget)}</p>
          </div>
          <div className="rounded-lg bg-white/10 p-2.5">
            <p className="text-white/60 text-[10px] uppercase">Status</p>
            <p className="font-bold mt-0.5 truncate" title={project.status}>
              {t(STATUS_LABEL_KEYS[project.status] ?? "common.status")}
            </p>
          </div>
          <div className="rounded-lg bg-white/10 p-2.5">
            <p className="text-white/60 text-[10px] uppercase">{t("stat.bids")}</p>
            <p className="font-bold mt-0.5">{bidCount}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {project.client && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("common.client")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-electric-500/10 flex items-center justify-center text-electric-600 font-bold">
                {project.client.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{project.client.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <IconStar width={12} height={12} className="text-amber-500" />
                  {t("common.verified")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t("common.description")}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {project.description}
          </p>
        </div>

        {isOwner && <ProjectInvitationsPanel projectId={project.id} />}

        <ProjectBidsList
          project={project}
          canManage={isOwner && user?.role === "CLIENT"}
          onUpdated={onRefresh}
        />

        <ProjectPaymentCard project={project} onUpdated={onRefresh} />

        {isOwner && project.status === "IN_PROGRESS" && (
          <Link
            href={`/messages?project=${project.id}`}
            className="block text-center text-sm font-semibold text-electric-600 hover:underline"
          >
            Open project chat →
          </Link>
        )}

        {isOwner && (project.status === "IN_PROGRESS" || project.status === "COMPLETED") && (
          <ProjectReviewSection
            projectId={project.id}
            projectTitle={project.title}
            engineerName={
              project.bids?.find((b) => b.status === "ACCEPTED")?.engineer.user
                .name
            }
            onSubmitted={onRefresh}
          />
        )}

        {!isOwner && <BidForm project={project} onSubmitted={onRefresh} />}
      </div>
    </Card>
  );
}
