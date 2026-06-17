"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FILE 3 of 4
// Replace:  features/messages/components/ProjectContextPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/UI";
import { useI18n } from "@/i18n";
import type { ConversationListItem } from "../types";
import useAuthStore from "@/store/authStore";
import {
  fetchProjectPayment,
  releaseEscrowPayment,
} from "@/features/escrow/api/payments.api";
import { checkoutPath } from "@/features/escrow/utils/goToCheckout";
import api from "@/lib/axios";

// ─── types ───────────────────────────────────────────────────────────────────

interface ProjectPayment {
  id: number;
  status: "PENDING" | "FUNDED" | "RELEASED" | "REFUNDED";
  amount: number;
  commission: number;
}

interface ProjectContextPanelProps {
  conversation: ConversationListItem | null;
  onProjectUpdated?: () => void | Promise<void>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, "green" | "amber" | "blue" | "slate"> = {
  OPEN: "blue",
  IN_PROGRESS: "amber",
  AWAITING_APPROVAL: "amber",
  COMPLETED: "green",
  CANCELLED: "slate",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Inquiry / Bidding",
  IN_PROGRESS: "In progress",
  AWAITING_APPROVAL: "Awaiting approval",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── panel ───────────────────────────────────────────────────────────────────

export function ProjectContextPanel({
  conversation,
  onProjectUpdated,
}: ProjectContextPanelProps) {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  const [payment, setPayment] = useState<ProjectPayment | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";

  // Fetch payment for the active project whenever conversation changes
  const loadPayment = useCallback(async (projectId: number) => {
    setLoadingPayment(true);
    setActionError(null);
    try {
      const data = await fetchProjectPayment(projectId) as ProjectPayment | null;
      setPayment(data ?? null);
    } catch {
      setPayment(null);
    } finally {
      setLoadingPayment(false);
    }
  }, []);

  useEffect(() => {
    if (!conversation) {
      setPayment(null);
      return;
    }
    loadPayment(conversation.projectId);
  }, [conversation, loadPayment]);

  // ── handlers ───────────────────────────────────────────────────────────────

  const handlePay = () => {
    if (!conversation) return;
    router.push(checkoutPath(conversation.projectId));
  };

  const handleMarkFinished = async () => {
    if (!conversation) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/projects/${conversation.projectId}/finish`);
      await loadPayment(conversation.projectId);
      await onProjectUpdated?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setActionError(err?.response?.data?.message ?? "Failed to mark as finished");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!payment) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await releaseEscrowPayment(payment.id);
      await loadPayment(conversation!.projectId);
      await onProjectUpdated?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setActionError(err?.response?.data?.message ?? "Failed to release payment");
    } finally {
      setActionLoading(false);
    }
  };

  // ── empty state ────────────────────────────────────────────────────────────

  if (!conversation) {
    return (
      <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col p-4">
        <p className="text-sm text-slate-500">Select a conversation</p>
      </aside>
    );
  }

  // ── derived state ──────────────────────────────────────────────────────────

  const projectStatus = conversation.projectStatus;
  const paymentStatus = payment?.status ?? null;

  // Client: show Pay button when project is active but not yet paid
  const showPayButton =
    isClient &&
    projectStatus === "IN_PROGRESS" &&
    (paymentStatus === null || paymentStatus === "PENDING");

  const showEscrowFundedBadge =
    projectStatus === "IN_PROGRESS" && paymentStatus === "FUNDED";

  const showWaitingForPayment =
    isEngineer &&
    projectStatus === "IN_PROGRESS" &&
    (paymentStatus === null || paymentStatus === "PENDING");

  const showMarkFinished =
    isEngineer &&
    projectStatus === "IN_PROGRESS" &&
    paymentStatus === "FUNDED";

  // Client: show "Confirm received" when engineer has marked done
  const showConfirmReceived =
    isClient &&
    projectStatus === "AWAITING_APPROVAL" &&
    paymentStatus === "FUNDED";

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col">
      {/* Project info */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Project
        </p>
        <p className="mt-1 font-bold text-sm">{conversation.projectTitle}</p>
        <div className="mt-2">
          <Badge color={STATUS_COLORS[projectStatus] ?? "slate"}>
            {STATUS_LABELS[projectStatus] ?? projectStatus.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Participant */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          {isClient ? "Engineer" : "Client"}
        </p>
        <p className="text-sm font-medium">{conversation.participantName}</p>
      </div>

      {/* Payment actions */}
      <div className="p-4 flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Payment
        </p>

        {/* Loading skeleton */}
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
              {formatAmount(
                isEngineer ? payment.amount - payment.commission : payment.amount,
              )}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              {isClient
                ? t("pay.escrowFundedHint")
                : t("bal.securedHint")}
            </p>
          </div>
        )}

        {!loadingPayment && showConfirmReceived && payment && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {isClient ? t("pay.workDone") : t("bal.status.awaiting_release")}
            </p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mt-1">
              {formatAmount(
                isEngineer ? payment.amount - payment.commission : payment.amount,
              )}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              {isClient ? t("pay.workDoneHint") : t("bal.awaitingReleaseHint")}
            </p>
          </div>
        )}

        {!loadingPayment && paymentStatus === "RELEASED" && payment && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t("pay.released")}
            </p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
              {formatAmount(payment.amount - payment.commission)}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{t("pay.releasedHint")}</p>
          </div>
        )}

        {/* ── CLIENT: Pay button ── */}
        {!loadingPayment && showPayButton && (
          <button
            type="button"
            onClick={handlePay}
            className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
            {t("pay.fundEscrow")}
          </button>
        )}

        {/* ── ENGINEER: Mark as finished ── */}
        {!loadingPayment && showMarkFinished && (
          <button
            type="button"
            onClick={handleMarkFinished}
            disabled={actionLoading}
            className="w-full h-10 rounded-lg bg-electric-500 hover:bg-electric-400 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            {actionLoading ? (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {t("pay.markFinished")}
          </button>
        )}

        {/* ── CLIENT: Send payment ── */}
        {!loadingPayment && showConfirmReceived && (
          <button
            type="button"
            onClick={handleConfirmReceived}
            disabled={actionLoading}
            className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
          >
            {actionLoading ? (
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {t("pay.sendToEngineer")}
          </button>
        )}

        {/* Error */}
        {actionError && (
          <p className="text-xs text-rose-500 px-1">{actionError}</p>
        )}

        {/* Context tip */}
        {!loadingPayment && projectStatus === "OPEN" && (
          <p className="text-xs text-slate-500">
            Payment options appear once a bid is accepted and the project starts.
          </p>
        )}
      </div>
    </aside>
  );
}
