"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/UI";
import { IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import type { Project, ServiceType } from "../api/project.api";
import { updateProject } from "../api/project.api";
import { BidForm } from "@/features/bids/components/BidForm";
import { ProjectBidsList } from "./ProjectBidsList";
import { ProjectPaymentCard } from "./ProjectPaymentCard";
import { ProjectReviewSection } from "@/features/reviews/components/ProjectReviewSection";
import { ProjectInvitationsPanel } from "./ProjectInvitationsPanel";
import { EditProjectModal } from "./EditProjectModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { STATUS_LABEL_KEYS } from "../utils/projectStatus";

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  DESIGN: "service.design",
  SUPERVISION: "service.supervision",
  REVIEW: "service.review",
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
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  if (error) {
    return (
      <Card className="p-8 text-center text-slate-500">
        <p className="font-semibold text-rose-500">{t("pm.failedLoadProject")}</p>
        <p className="mt-1 text-sm">{error}</p>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className="p-8 text-center text-slate-500">
        <p className="mt-1 text-sm">{t("pm.selectProject")}</p>
      </Card>
    );
  }

  const label = SERVICE_TYPE_LABELS[project.serviceType] ?? project.serviceType;
  const bidCount = project._count?.bids ?? project.bids?.length ?? 0;
  const isOwner = user?.id === project.clientId;
  const permissions = project.permissions;
  const canEditContent = permissions?.canEditContent ?? false;
  const canToggleStatus = permissions?.canToggleStatus ?? false;
  const isLocked = permissions?.editTier === "LOCKED";
  const isStatusOnly = permissions?.editTier === "STATUS_ONLY";

  const isProjectOpen = project.status === "OPEN";
  const targetStatus = isProjectOpen ? "CLOSED" : "OPEN";

  async function handleToggleStatus() {
    setStatusLoading(true);
    setStatusMessage(null);
    try {
      await updateProject(project!.id, { status: targetStatus });
      setStatusMessage({
        type: "success",
        text: isProjectOpen
          ? t("pm.projectClosedSuccess")
          : t("pm.projectReopenedSuccess"),
      });
      onRefresh?.();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err as Error)?.message ??
        t("pm.projectStatusUpdateError");
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setStatusLoading(false);
      setConfirmOpen(false);
    }
  }

  // Map backend lock reason string to i18n key
  let lockReasonText = permissions?.lockReason;
  if (permissions?.lockReason) {
    if (permissions.lockReason.includes("managed automatically")) {
      lockReasonText = t("pm.lockReason.locked");
    } else if (permissions.lockReason.includes("bids. Content is locked")) {
      lockReasonText = t("pm.lockReason.statusOnly");
    } else if (permissions.lockReason.includes("after bids have been received")) {
      lockReasonText = t("pm.lockReason.contentLocked");
    } else if (permissions.lockReason.includes("fully locked")) {
      lockReasonText = t("pm.lockReason.fullyLocked");
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
          <Badge className="!bg-white/10 !text-white !border-white/20">
            {t(SERVICE_TYPE_LABELS[project.serviceType])}
          </Badge>
          <h3 className="mt-3 text-xl font-bold">{project.title}</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-white/10 p-2.5">
              <p className="text-white/60 text-[10px] uppercase">{t("common.budget")}</p>
              <p className="font-bold mt-0.5">{formatMoney(project.budget)}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5">
              <p className="text-white/60 text-[10px] uppercase">{t("common.status")}</p>
              <p className="font-bold mt-0.5 truncate" title={project.status}>
                {t(STATUS_LABEL_KEYS[project.status] ?? "common.status")}
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5">
              <p className="text-white/60 text-[10px] uppercase">{t("stat.bids")}</p>
              <p className="font-bold mt-0.5">{bidCount}</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2.5">
              <p className="text-white/60 text-[10px] uppercase">{t("common.posted")}</p>
              <p className="font-bold mt-0.5 truncate">
                {new Date(project.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ─── Edit-Lock UI ─── */}
          {isOwner && permissions && (
            <div className="space-y-3">
              {/* FULL: Show edit button */}
              {canEditContent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="w-full sm:w-auto"
                >
                  {t("pm.editProject")}
                </Button>
              )}

              {/* Status Toggle Button (Available in both FULL and STATUS_ONLY tiers) */}
              {canToggleStatus && (
                <Button
                  variant={isProjectOpen ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => {
                    setStatusMessage(null);
                    setConfirmOpen(true);
                  }}
                  className="w-full sm:w-auto ml-0 sm:ml-2 mt-2 sm:mt-0"
                >
                  {isProjectOpen ? t("pm.closeProject") : t("pm.reopenProject")}
                </Button>
              )}

              {/* STATUS_ONLY: Lock banner (Content locked) */}
              {isStatusOnly && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 mt-3">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                    {lockReasonText}
                  </p>
                </div>
              )}

              {/* LOCKED: Read-only banner */}
              {isLocked && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {lockReasonText}
                  </p>
                </div>
              )}

              {/* Inline status message */}
              {statusMessage && (
                <div
                  className={`rounded-lg border p-3 text-xs font-medium ${
                    statusMessage.type === "success"
                      ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                      : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                  }`}
                >
                  {statusMessage.type === "success" ? "✅" : "❌"} {statusMessage.text}
                </div>
              )}
            </div>
          )}

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
              {t("pm.openProjectChat")}
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

      {/* Edit Modal — only rendered when canEditContent */}
      {isOwner && canEditContent && (
        <EditProjectModal
          open={editOpen}
          project={project}
          onClose={() => setEditOpen(false)}
          onUpdated={onRefresh}
        />
      )}

      {/* Confirm Dialog — status toggle */}
      <ConfirmDialog
        open={confirmOpen}
        title={isProjectOpen ? t("pm.closeProjectTitle") : t("pm.reopenProjectTitle")}
        message={
          isProjectOpen
            ? t("pm.closeProjectDesc")
            : t("pm.reopenProjectDesc")
        }
        confirmLabel={isProjectOpen ? t("pm.closeProject") : t("pm.reopenProject")}
        variant={isProjectOpen ? "danger" : "primary"}
        loading={statusLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
