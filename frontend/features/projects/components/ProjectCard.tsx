"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Card } from "../../../components/UI";
import {
  IconArrow,
  IconBolt,
  IconBriefcase,
  IconClock,
  IconLocation,
  IconSearch,
  IconStar,
  IconWallet,
} from "../../../components/Icons";
import { useI18n } from "../../../i18n";
import { cn } from "../../../utils/cn";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useProjects } from "../hooks/useProjects";
import type { Project, ServiceType } from "../api/project.api";
import { isReviewableStatus } from "../utils/projectStatus";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  DESIGN: "Design",
  SUPERVISION: "Supervision",
  REVIEW: "Review",
};

const SERVICE_TYPE_COLORS: Record<ServiceType, "blue" | "violet" | "green"> = {
  DESIGN: "blue",
  SUPERVISION: "violet",
  REVIEW: "green",
};
interface ProjectCardProps {
  project: Project;
  selected: boolean;
  onClick: () => void;
}

export function ProjectCard({ project, selected, onClick }: ProjectCardProps) {
  const { t } = useI18n();
  const color = SERVICE_TYPE_COLORS[project.serviceType] ?? "slate";
  const label = SERVICE_TYPE_LABELS[project.serviceType] ?? project.serviceType;
  const bidCount = project._count?.bids ?? project.bids?.length ?? 0;

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-5 cursor-pointer hover:border-electric-500/40 transition",
        selected && "border-electric-500/60 ring-2 ring-electric-500/20",
      )}
    >
      <div className="flex items-start justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold truncate block w-full">{project.title}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {project.description}
          </p>
        </div>
        <Badge color={color}>{label}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm w-full min-w-0">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <IconWallet width={14} height={14} className="text-electric-500 shrink-0" />
          {formatMoney(project.budget)}
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <IconLocation width={14} height={14} className="text-electric-500 shrink-0" />
          {t("common.remote")}
        </span>
        <span className="sm:ms-auto text-xs text-slate-500 shrink-0">
          {bidCount} {t("common.bids")} · {t("common.posted")}{" "}
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        <Badge>{label}</Badge>
        {project.client && <Badge color="slate">{project.client.name}</Badge>}
        {project.status === "IN_PROGRESS" && project.payment?.status !== "FUNDED" && (
          <Badge color="slate">{t("pay.status.needsPayment")}</Badge>
        )}
        {project.status === "IN_PROGRESS" && project.payment?.status === "FUNDED" && (
          <Badge color="blue">{t("pay.status.inProgress")}</Badge>
        )}
        {isReviewableStatus(project.status) && (
          <Badge color="amber">{t("pay.status.reviewWork")}</Badge>
        )}
        {project.status === "REVISION_REQUESTED" && (
          <Badge color="violet">{t("proj.status.revision")}</Badge>
        )}
        {project.status === "COMPLETED" && (
          <Badge color="green">{t("pay.status.completed")}</Badge>
        )}
      </div>
    </Card>
  );
}
