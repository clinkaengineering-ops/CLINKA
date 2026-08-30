"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Badge } from "@/components/UI";
import { IconShield, IconWallet, IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import type { Project } from "../api/project.api";
import { SubmitWorkModal } from "./SubmitWorkModal";
import { isReviewableStatus } from "../utils/projectStatus";
import { approveProjectWork } from "../api/project.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { checkoutPath } from "@/features/escrow/utils/goToCheckout";

interface ProjectPaymentCardProps {
  project: Project;
  onUpdated?: () => void;
}

export function ProjectPaymentCard({ project, onUpdated }: ProjectPaymentCardProps) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";

  if (project.status === "OPEN" || project.status === "CANCELLED") return null;

  const acceptedBid = project.bids?.find((b) => b.status === "ACCEPTED");
  const amount = project.payment?.amountUsd ?? acceptedBid?.price ?? project.budget;

  const handleApprove = async () => {
    if (!confirm(t("es.confirmRelease"))) return;
    setLoading(true);
    try {
      await approveProjectWork(project.id);
      onUpdated?.();
    } catch (err) {
      console.error(err);
      alert(t("pay.approveFailed"));
    } finally {
      setLoading(false);
    }
  };

  let card: React.ReactNode = null;

  const hasPendingPayment = project.payment?.manualSubmissions?.some(s => s.status === "PENDING");

  if ((project.status === "IN_PROGRESS" || project.status === "AWAITING_PAYMENT") && project.payment?.status !== "FUNDED") {
    card = (
      <Card className="p-5 border-s-4 border-s-slate-400 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconWallet width={18} height={18} className="text-slate-500" />
              <h4 className="font-bold">{t("pay.status.needsPayment")}</h4>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isClient ? 
                (hasPendingPayment ? "Your payment was submitted and is waiting for admin verification." :
                (project.status === "AWAITING_PAYMENT" ? "Engineer accepted. Fund the escrow to start the project." : "Fund the escrow to start the project.")) 
                : t("pay.waitingClient")}
            </p>
          </div>
          {isClient && !hasPendingPayment && (
            <Link href={checkoutPath(project.id)}>
              <Button size="sm">{t("pay.action.payToStart")}</Button>
            </Link>
          )}
          {isClient && hasPendingPayment && (
            <div className="shrink-0">
              <Badge color="slate">Awaiting Admin Verification</Badge>
            </div>
          )}
        </div>
      </Card>
    );
  } else if (project.status === "IN_PROGRESS" && project.payment?.status === "FUNDED") {
    card = (
      <Card className="p-5 border-s-4 border-s-blue-500 bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconShield width={18} height={18} className="text-blue-600 dark:text-blue-400" />
              <h4 className="font-bold text-blue-900 dark:text-blue-100">{t("pay.escrowFunded")}</h4>
            </div>
            <p className="text-sm text-blue-700/80 dark:text-blue-300 mt-1">
              {isClient
                ? t("pay.escrowFundedHint")
                : "Payment is secured in escrow. Submit work when you are done."}
            </p>
            <p className="text-xs font-bold mt-2 text-blue-800 dark:text-blue-200">
              {formatMoney(amount)}
            </p>
          </div>
          {isEngineer && (
            <Button size="sm" onClick={() => setShowSubmitModal(true)} disabled={loading}>
              {t("pay.submitWork.submit")}
            </Button>
          )}
          {isClient && <Badge color="blue">{t("pay.action.waitingEngineer")}</Badge>}
        </div>
      </Card>
    );
  } else if (isReviewableStatus(project.status)) {
    card = (
      <Card className="p-5 border-s-4 border-s-amber-500 bg-amber-50 dark:bg-amber-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconCheck width={18} height={18} className="text-amber-600 dark:text-amber-400" />
              <h4 className="font-bold text-amber-900 dark:text-amber-100">{t("pay.workDone")}</h4>
            </div>
            <p className="text-sm text-amber-700/80 dark:text-amber-300 mt-1">
              {isClient ? t("pay.workDoneHint") : t("pay.action.waitingClient")}
            </p>
          </div>
          {isClient && (
            <Button
              size="sm"
              className="!bg-amber-500 hover:!bg-amber-600 !text-white"
              onClick={handleApprove}
              disabled={loading}
            >
              {t("pay.approveWork")}
            </Button>
          )}
          {isEngineer && <Badge color="amber">{t("pay.action.waitingClient")}</Badge>}
        </div>
      </Card>
    );
  } else if (project.status === "REVISION_REQUESTED") {
    card = (
      <Card className="p-5 border-s-4 border-s-violet-500 bg-violet-50 dark:bg-violet-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="font-bold text-violet-900 dark:text-violet-100">
              {t("pay.revisionRequested")}
            </h4>
            <p className="text-sm text-violet-700/80 dark:text-violet-300 mt-1">
              {isEngineer ? t("pay.submitWork.resubmitHint") : t("pay.revisionWaiting")}
            </p>
          </div>
          {isEngineer && (
            <Button size="sm" onClick={() => setShowSubmitModal(true)}>
              {t("pay.submitWork.resubmit")}
            </Button>
          )}
        </div>
      </Card>
    );
  } else if (project.status === "COMPLETED" && project.payment?.status === "RELEASED") {
    card = (
      <Card className="p-5 border-s-4 border-s-green-500 bg-green-50 dark:bg-green-900/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <IconCheck width={18} height={18} className="text-green-600 dark:text-green-400" />
              <h4 className="font-bold text-green-900 dark:text-green-100">
                {t("pay.action.paymentSent")}
              </h4>
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

  if (!card) return null;

  return (
    <>
      {card}
      {showSubmitModal && (
        <SubmitWorkModal
          projectId={project.id}
          projectTitle={project.title}
          isRevision={project.status === "REVISION_REQUESTED"}
          onClose={() => setShowSubmitModal(false)}
          onSubmitted={() => onUpdated?.()}
        />
      )}
    </>
  );
}
