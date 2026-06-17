"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Badge } from "@/components/UI";
import { IconShield, IconWallet, IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import type { Project } from "../api/project.api";
import { markProjectFinished } from "../api/project.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

interface ProjectPaymentCardProps {
  project: Project;
  onUpdated?: () => void;
}

export function ProjectPaymentCard({ project, onUpdated }: ProjectPaymentCardProps) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";

  // We only show this card if the project is no longer OPEN
  if (project.status === "OPEN" || project.status === "CANCELLED") return null;

  // Determine accepted bid to show amounts correctly
  const acceptedBid = project.bids?.find((b) => b.status === "ACCEPTED");
  const amount = project.payment?.amount ?? acceptedBid?.price ?? project.budget;

  const handleMarkFinished = async () => {
    if (!confirm(t("es.confirmRelease") || "Mark project as finished?")) return;
    setLoading(true);
    try {
      await markProjectFinished(project.id);
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert("Failed to mark finished");
    } finally {
      setLoading(false);
    }
  };

  // State: IN_PROGRESS (No Payment yet / Pending)
  if (project.status === "IN_PROGRESS" && project.payment?.status !== "FUNDED") {
    return (
      <Card className="p-5 border-l-4 border-l-slate-400 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconWallet width={18} height={18} className="text-slate-500" />
              <h4 className="font-bold">{t("pay.status.needsPayment")}</h4>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isClient
                ? "Fund the escrow to start the project."
                : t("pay.waitingClient")}
            </p>
          </div>
          {isClient && (
            <Link href={`/escrow/checkout?projectId=${project.id}`}>
              <Button size="sm">{t("pay.action.payToStart")}</Button>
            </Link>
          )}
        </div>
      </Card>
    );
  }

  // State: IN_PROGRESS (Funded in Escrow)
  if (project.status === "IN_PROGRESS" && project.payment?.status === "FUNDED") {
    return (
      <Card className="p-5 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconShield width={18} height={18} className="text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-blue-900 dark:text-blue-100">{t("pay.escrowFunded")}</h4>
            </div>
            <p className="text-sm text-blue-700/80 dark:text-blue-300 mt-1">
              {isClient
                ? t("pay.escrowFundedHint")
                : "Payment is secured in escrow. Mark as finished when you complete the work."}
            </p>
            <p className="text-xs font-bold mt-2 text-blue-800 dark:text-blue-200">
              {formatMoney(amount)}
            </p>
          </div>
          {isEngineer && (
            <Button size="sm" onClick={handleMarkFinished} disabled={loading}>
              {loading ? t("common.loading") : t("pay.action.markFinished")}
            </Button>
          )}
          {isClient && (
            <Badge color="blue">{t("pay.action.waitingEngineer")}</Badge>
          )}
        </div>
      </Card>
    );
  }

  // State: AWAITING_APPROVAL (Engineer marked finished)
  if (project.status === "AWAITING_APPROVAL") {
    return (
      <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconCheck width={18} height={18} className="text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-amber-900 dark:text-amber-100">{t("pay.workDone")}</h4>
            </div>
            <p className="text-sm text-amber-700/80 dark:text-amber-300 mt-1">
              {isClient
                ? t("pay.workDoneHint")
                : "Waiting for the client to review your work and release the payment."}
            </p>
          </div>
          {isClient && (
            <Link href={`/escrow?project=${project.id}`}>
              <Button size="sm" className="!bg-amber-500 hover:!bg-amber-600 !text-white">
                {t("pay.action.releasePayment")}
              </Button>
            </Link>
          )}
          {isEngineer && (
            <Badge color="amber">{t("pay.action.waitingClient")}</Badge>
          )}
        </div>
      </Card>
    );
  }

  // State: COMPLETED (Payment Released)
  if (project.status === "COMPLETED" && project.payment?.status === "RELEASED") {
    return (
      <Card className="p-5 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconCheck width={18} height={18} className="text-green-600 dark:text-green-400" />
              <h4 className="font-bold text-green-900 dark:text-green-100">{t("pay.action.paymentSent")}</h4>
            </div>
            <p className="text-sm text-green-700/80 dark:text-green-300 mt-1">
              {formatMoney(amount)} • {isClient ? "Released to engineer" : t("pay.releasedHint")}
            </p>
          </div>
          <Badge color="green">{t("pay.status.completed")}</Badge>
        </div>
      </Card>
    );
  }

  return null;
}
