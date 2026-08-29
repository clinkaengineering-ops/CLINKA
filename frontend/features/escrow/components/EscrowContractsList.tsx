"use client";

import Link from "next/link";
import { Badge, Button, Card, Progress } from "@/components/UI";
import {
  IconCheck,
  IconClock,
  IconArrow,
} from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { EscrowContractRow, EscrowDisplayStatus } from "../types";
import { formatMoney } from "../utils/formatMoney";

function statusBadgeColor(
  status: EscrowDisplayStatus,
): "green" | "electric" | "amber" | "slate" {
  if (status === "Released") return "green";
  if (status === "In escrow") return "electric";
  if (status === "Pending") return "amber";
  return "slate";
}

function statusKey(status: EscrowDisplayStatus): string {
  switch (status) {
    case "Released":
      return "es.s.released";
    case "In escrow":
      return "es.s.inEscrow";
    case "Refunded":
      return "es.s.refunded";
    default:
      return "es.s.pending";
  }
}

function timelineStatus(status: EscrowDisplayStatus): string {
  if (status === "Released") return "Released";
  if (status === "In escrow") return "In Escrow";
  if (status === "Pending") return "Pending";
  return "Upcoming";
}

export function EscrowContractsList({
  contracts,
  selectedProjectId,
  onSelect,
  onFund,
  onRelease,
  onRefund,
  actionLoading,
}: {
  contracts: EscrowContractRow[];
  selectedProjectId: number | null;
  onSelect: (projectId: number) => void;
  onFund: (row: EscrowContractRow) => void;
  onRelease: (paymentId: number) => void;
  onRefund?: (paymentId: number) => void;
  actionLoading: boolean;
}) {
  const { t } = useI18n();

  const selected =
    contracts.find((c) => c.projectId === selectedProjectId) ?? contracts[0];

  const releasedCount = contracts.filter((c) => c.status === "Released").length;
  const progress =
    contracts.length > 0
      ? Math.round((releasedCount / contracts.length) * 100)
      : 0;

  if (contracts.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500">{t("es.noContracts")}</Card>
    );
  }

  return (
    <Card>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold">{t("es.milestones")}</h2>
          {selected && (
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.projectTitle} · {formatMoney(selected.amountUsd)}
            </p>
          )}
        </div>
        {selected && (
          <Link href={`/projects?id=${selected.projectId}`}>
            <Button size="sm" variant="secondary">
              {t("es.openProject")}
            </Button>
          </Link>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-bold">{t("es.overallProgress")}</span>
          <span className="text-slate-500">
            {releasedCount} / {contracts.length} {t("es.releasedCount")}
          </span>
        </div>
        <Progress value={progress} />

        <div className="mt-8 space-y-3">
          {contracts.map((row, i) => {
            const ts = timelineStatus(row.status);
            const isSelected = row.projectId === (selected?.projectId ?? null);
            return (
              <div key={row.projectId} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                      ts === "Released"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : ts === "In Escrow"
                          ? "bg-electric-500 border-electric-500 text-white"
                          : ts === "Pending"
                            ? "border-amber-500 text-amber-500"
                            : "border-slate-300 text-slate-400 dark:border-slate-700"
                    }`}
                  >
                    {ts === "Released" ? (
                      <IconCheck width={16} height={16} />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < contracts.length - 1 && (
                    <div
                      className={`flex-1 w-0.5 mt-1 min-h-[24px] ${
                        ts === "Released"
                          ? "bg-emerald-500"
                          : "bg-slate-200 dark:bg-slate-800"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div
                    className={`rounded-xl border p-4 transition cursor-pointer ${
                      isSelected
                        ? "border-electric-500/60 bg-electric-500/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-electric-500/40"
                    }`}
                    onClick={() => onSelect(row.projectId)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onSelect(row.projectId)
                    }
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{row.projectTitle}</p>
                          <Badge color={statusBadgeColor(row.status)}>
                            {t(statusKey(row.status))}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t("es.projectPayment")}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-electric-600 dark:text-electric-400">
                        {formatMoney(row.amountUsd)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <IconClock width={12} height={12} />
                        {new Date(row.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        {row.status === "In escrow" &&
                          row.paymentId &&
                          (row.projectStatus === "SUBMITTED_FOR_REVIEW" ||
                            row.projectStatus === "AWAITING_APPROVAL") && (
                          <>
                            <Button
                              size="sm"
                              disabled={actionLoading}
                              icon={<IconCheck width={12} height={12} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(t("es.confirmRelease"))
                                ) {
                                  onRelease(row.paymentId!);
                                }
                              }}
                            >
                              {t("pay.sendToEngineer")}
                            </Button>
                            {onRefund && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={actionLoading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRefund(row.paymentId!);
                                }}
                              >
                                {t("common.refundReq")}
                              </Button>
                            )}
                          </>
                        )}
                        {row.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFund(row);
                            }}
                          >
                            {t("common.fund")}
                          </Button>
                        )}
                        {row.status === "Released" && (
                          <Link
                            href={`/projects?id=${row.projectId}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<IconArrow width={12} height={12} />}
                            >
                              {t("common.details")}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
