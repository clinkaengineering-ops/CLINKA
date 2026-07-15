"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/UI";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import type { ConversationListItem } from "../types";
import useAuthStore from "@/store/authStore";
import { fetchProjectPayment } from "@/features/escrow/api/payments.api";
import { checkoutPath } from "@/features/escrow/utils/goToCheckout";
import {
  approveProjectWork,
  fetchProjectSubmissions,
  requestProjectRevision,
  type ProjectSubmission,
} from "@/features/projects/api/project.api";
import { SubmitWorkModal } from "@/features/projects/components/SubmitWorkModal";
import {
  isReviewableStatus,
  isSubmittableStatus,
  STATUS_COLORS,
  STATUS_LABEL_KEYS,
} from "@/features/projects/utils/projectStatus";
import { MessagesPolicyNotice } from "./MessagesPolicyNotice";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

interface ProjectPayment {
  id: number;
  status: "PENDING" | "FUNDED" | "RELEASED" | "REFUNDED";
  amountUsd: number;
  commission: number;
}

interface ProjectContextPanelProps {
  conversation: ConversationListItem | null;
  onProjectUpdated?: () => void | Promise<void>;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function ProjectContextPanel({
  conversation,
  onProjectUpdated,
  isMobileOpen = false,
  onCloseMobile,
}: ProjectContextPanelProps) {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  const [payment, setPayment] = useState<ProjectPayment | null>(null);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";

  const loadContext = useCallback(async (projectId: number) => {
    setLoadingPayment(true);
    setActionError(null);
    try {
      const [paymentData, submissionData] = await Promise.all([
        fetchProjectPayment(projectId) as Promise<ProjectPayment | null>,
        fetchProjectSubmissions(projectId).catch(() => []),
      ]);
      setPayment(paymentData ?? null);
      setSubmissions(submissionData);
    } catch {
      setPayment(null);
      setSubmissions([]);
    } finally {
      setLoadingPayment(false);
    }
  }, []);

  useEffect(() => {
    if (!conversation) {
      setPayment(null);
      setSubmissions([]);
      return;
    }
    loadContext(conversation.projectId);
  }, [conversation, loadContext]);

  const handlePay = () => {
    if (!conversation) return;
    router.push(checkoutPath(conversation.projectId));
  };

  const handleApprove = async () => {
    if (!conversation) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await approveProjectWork(conversation.projectId);
      await loadContext(conversation.projectId);
      await onProjectUpdated?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setActionError(err?.response?.data?.message ?? t("pay.approveFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!conversation || revisionNote.trim().length < 10) {
      setActionError(t("pay.revisionMinLength"));
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await requestProjectRevision(conversation.projectId, revisionNote.trim());
      setRevisionNote("");
      setShowRevisionForm(false);
      await loadContext(conversation.projectId);
      await onProjectUpdated?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setActionError(err?.response?.data?.message ?? t("pay.revisionFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  if (!conversation) {
    return (
      <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-4">
        <p className="text-sm text-slate-500">Select a conversation</p>
      </aside>
    );
  }

  const projectStatus = conversation.projectStatus;
  const paymentStatus = payment?.status ?? null;
  const latestSubmission = submissions[0];

  const showPayButton =
    isClient &&
    (projectStatus === "IN_PROGRESS" || projectStatus === "AWAITING_PAYMENT") &&
    (paymentStatus === null || paymentStatus === "PENDING");

  const showEscrowFundedBadge =
    projectStatus === "IN_PROGRESS" && paymentStatus === "FUNDED";

  const showWaitingForPayment =
    isEngineer &&
    (projectStatus === "IN_PROGRESS" || projectStatus === "AWAITING_PAYMENT") &&
    (paymentStatus === null || paymentStatus === "PENDING");

  const showSubmitWork =
    isEngineer &&
    isSubmittableStatus(projectStatus) &&
    paymentStatus === "FUNDED";

  const showReviewActions =
    isClient &&
    isReviewableStatus(projectStatus) &&
    paymentStatus === "FUNDED";

  const showRevisionBanner =
    projectStatus === "REVISION_REQUESTED" && latestSubmission?.revisionNote;

  const statusLabelKey = STATUS_LABEL_KEYS[projectStatus];
  const statusLabel = statusLabelKey ? t(statusLabelKey) : projectStatus.replace(/_/g, " ");

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "border-s border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto",
          !isMobileOpen && "hidden lg:flex",
          isMobileOpen && "fixed inset-y-0 end-0 z-[100] w-full max-w-sm bg-white dark:bg-slate-950 shadow-2xl animate-slide-in-right flex lg:static lg:w-auto lg:shadow-none lg:z-auto lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Project
            </p>
            <p className="mt-1 font-bold text-sm">{conversation.projectTitle}</p>
            <div className="mt-2">
              <Badge color={STATUS_COLORS[projectStatus] ?? "slate"}>
                {statusLabel}
              </Badge>
            </div>
          </div>
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          {isClient ? "Engineer" : "Client"}
        </p>
        <p className="text-sm font-medium">{conversation.participantName}</p>
      </div>

      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <MessagesPolicyNotice />
      </div>

      {latestSubmission && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
            {t("pay.deliverables.title")}
          </p>
          {latestSubmission.notes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {latestSubmission.notes}
            </p>
          )}
          <ul className="space-y-1">
            {latestSubmission.deliverables.map((d) => (
              <li key={d.id}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-electric-600 hover:underline truncate block"
                >
                  {d.name ?? d.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRevisionBanner && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            {t("pay.revisionRequested")}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {latestSubmission?.revisionNote}
          </p>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Payment
        </p>

        {loadingPayment && (
          <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        )}

        {!loadingPayment && showWaitingForPayment && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("bal.status.awaiting_payment")}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{t("pay.waitingClient")}</p>
          </div>
        )}

        {!loadingPayment && showEscrowFundedBadge && payment && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isClient ? t("pay.escrowFunded") : t("bal.status.in_progress")}
            </p>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mt-1">
              {formatMoney(
                isEngineer ? payment.amountUsd - payment.commission : payment.amountUsd,
              )}
            </p>
          </div>
        )}

        {!loadingPayment && showReviewActions && payment && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t("pay.workDone")}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              {t("pay.workDoneHint")}
            </p>
          </div>
        )}

        {!loadingPayment && paymentStatus === "RELEASED" && payment && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("pay.released")}
            </p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
              {formatMoney(payment.amountUsd - payment.commission)}
            </p>
          </div>
        )}

        {!loadingPayment && showPayButton && (
          <button
            type="button"
            onClick={handlePay}
            className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            {t("pay.fundEscrow")}
          </button>
        )}

        {!loadingPayment && showSubmitWork && (
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full h-10 rounded-lg bg-electric-500 hover:bg-electric-400 text-white text-sm font-semibold"
          >
            {projectStatus === "REVISION_REQUESTED"
              ? t("pay.submitWork.resubmit")
              : t("pay.submitWork.submit")}
          </button>
        )}

        {!loadingPayment && showReviewActions && !showRevisionForm && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={actionLoading}
              className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {actionLoading ? t("common.loading") : t("pay.approveWork")}
            </button>
            <button
              type="button"
              onClick={() => setShowRevisionForm(true)}
              disabled={actionLoading}
              className="w-full h-10 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-300 text-sm font-semibold"
            >
              {t("pay.requestRevision")}
            </button>
          </div>
        )}

        {showRevisionForm && (
          <div className="space-y-2">
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={3}
              placeholder={t("pay.revisionPlaceholder")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent p-2 text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionForm(false)}
                className="flex-1 h-9 rounded-lg text-xs font-semibold text-slate-500"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRequestRevision}
                disabled={actionLoading}
                className="flex-1 h-9 rounded-lg bg-amber-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {t("pay.sendRevision")}
              </button>
            </div>
          </div>
        )}

        {actionError && (
          <p className="text-xs text-rose-500 px-1">{actionError}</p>
        )}
      </div>

      {showSubmitModal && conversation && (
        <SubmitWorkModal
          projectId={conversation.projectId}
          projectTitle={conversation.projectTitle}
          isRevision={projectStatus === "REVISION_REQUESTED"}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={async () => {
            await loadContext(conversation.projectId);
            await onProjectUpdated?.();
          }}
        />
      )}
    </aside>
    </>
  );
}
