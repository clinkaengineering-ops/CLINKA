"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button } from "@/components/UI";
import { IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { approveBid } from "@/features/bids/api/bids.api";
import type { Project, ProjectBid } from "../api/project.api";

interface ProjectBidsListProps {
  project: Project;
  canManage: boolean;
  onUpdated?: () => void;
}

export function ProjectBidsList({
  project,
  canManage,
  onUpdated,
}: ProjectBidsListProps) {
  const { t } = useI18n();
  const bids = project.bids ?? [];
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState(false);

  if (!bids.length) {
    return (
      <p className="text-sm text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        {t("pm.noBids")}
      </p>
    );
  }

  async function handleApprove(bid: ProjectBid) {
    setApprovingId(bid.id);
    setError(null);
    try {
      await approveBid(bid.id);
      setJustApproved(true);
      onUpdated?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to approve bid");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {t("stat.bids")} ({bids.length})
      </p>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      {(justApproved || project.status === "IN_PROGRESS") && (
        <div className="rounded-xl border border-electric-500/30 bg-electric-500/5 p-3 text-sm space-y-2">
          <p className="font-semibold text-electric-700 dark:text-electric-300">
            {t("pm.bidAcceptedNextSteps")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/messages?project=${project.id}`}>
              <Button size="sm" variant="secondary">
                {t("bal.openChat")}
              </Button>
            </Link>
          </div>
        </div>
      )}
      {bids.map((bid) => (
        <div
          key={bid.id}
          className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/engineers/${bid.engineer.user.id}`} className="font-semibold hover:underline text-electric-600 dark:text-electric-400">
                {bid.engineer.user.name}
              </Link>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatMoney(bid.price)} · {bid.duration}
              </p>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{bid.description}</p>
            </div>
            <Badge
              color={
                bid.status === "ACCEPTED"
                  ? "green"
                  : bid.status === "REJECTED"
                    ? "slate"
                    : "amber"
              }
            >
              {t(`ed.bid.${bid.status.toLowerCase()}`)}
            </Badge>
          </div>
          {canManage && project.status === "OPEN" && bid.status === "PENDING" && (
            <Button
              size="sm"
              className="mt-3"
              icon={<IconCheck width={14} height={14} />}
              disabled={approvingId === bid.id}
              onClick={() => handleApprove(bid)}
            >
              {approvingId === bid.id ? t("pm.approving") : t("pm.acceptBid")}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
