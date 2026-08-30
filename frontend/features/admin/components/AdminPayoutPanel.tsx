"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconWallet } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import {
  cancelAdminWithdrawal,
  fetchAdminWithdrawalRequests,
  fetchPayoutStats,
  fetchWithdrawalAuditTrail,
  resolveAdminWithdrawal,
  triggerPayoutReconciliation,
  revealAdminWithdrawalBankDetails,
  approveAdminWithdrawal,
  rejectAdminWithdrawal,
  initiateAdminTransfer,
  recordAdminCompletion,
  type AdminWithdrawalRequest,
  type PayoutAuditEntry,
  type PayoutStats,
} from "../api/admin.api";

function formatTimestamp(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function statusColor(
  status: AdminWithdrawalRequest["status"],
): "green" | "amber" | "blue" | "slate" | "rose" {
  if (status === "COMPLETED") return "green";
  if (
    status === "FAILED" ||
    status === "REJECTED" ||
    status === "CANCELLED" ||
    status === "FAILED_NEEDS_MANUAL_REVIEW"
  ) {
    return "rose";
  }
  if (status === "PROCESSING" || status === "SUBMITTED") return "blue";
  return "amber";
}

const STATUS_FILTERS: Array<AdminWithdrawalRequest["status"] | "ALL"> = [
  "ALL",
  "PENDING_REVIEW",
  "APPROVED",
  "TRANSFER_INITIATED",
  "FAILED_NEEDS_MANUAL_REVIEW",
  "PROCESSING",
  "SUBMITTED",
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "CANCELLED",
];

export function AdminPayoutPanel() {
  const { t } = useI18n();
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<
    AdminWithdrawalRequest["status"] | "ALL"
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState<number | null>(null);
  const [auditEntries, setAuditEntries] = useState<PayoutAuditEntry[]>([]);
  const [bankDetails, setBankDetails] = useState<{ withdrawalId: number; data: any } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, withdrawalsRes] = await Promise.all([
        fetchPayoutStats(),
        fetchAdminWithdrawalRequests(
          1,
          50,
          statusFilter === "ALL" ? undefined : statusFilter,
        ),
      ]);
      setStats(statsRes);
      setWithdrawals(withdrawalsRes.items);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const runReconcile = async () => {
    setActionLoading(true);
    try {
      const result = await triggerPayoutReconciliation();
      alert(`Reconciliation complete: ${result.updated} updated of ${result.checked} checked.`);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const openAudit = async (withdrawalId: number) => {
    setAuditOpen(withdrawalId);
    try {
      setAuditEntries(await fetchWithdrawalAuditTrail(withdrawalId));
    } catch (err) {
      alert(axiosMessage(err));
      setAuditOpen(null);
    }
  };

  const handleCancel = async (id: number) => {
    const reason = prompt("Cancellation reason (optional):") ?? undefined;
    setActionLoading(true);
    try {
      await cancelAdminWithdrawal(id, reason);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (
    id: number,
    action: "release_funds" | "mark_completed" | "cancel",
  ) => {
    const reason = prompt("Resolution notes (optional):") ?? undefined;
    setActionLoading(true);
    try {
      await resolveAdminWithdrawal(id, action, reason);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevealBankDetails = async (id: number) => {
    setActionLoading(true);
    try {
      const data = await revealAdminWithdrawalBankDetails(id);
      setBankDetails({ withdrawalId: id, data });
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    const notes = prompt("Approval notes (optional):") ?? undefined;
    setActionLoading(true);
    try {
      await approveAdminWithdrawal(id, notes);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Rejection reason (required):");
    if (!reason || reason.trim().length < 3) {
      alert("A reason of at least 3 characters is required.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectAdminWithdrawal(id, reason);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateTransfer = async (id: number) => {
    const ref = prompt("External transfer reference (required):");
    if (!ref || ref.trim().length < 3) {
      alert("A reference of at least 3 characters is required.");
      return;
    }
    setActionLoading(true);
    try {
      await initiateAdminTransfer(id, ref);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordCompletion = async (id: number) => {
    const ref = prompt("External transfer reference (required):");
    if (!ref || ref.trim().length < 3) {
      alert("A transfer reference is required.");
      return;
    }
    const methodStr = prompt("Transfer method (e.g., BANK_TRANSFER, INSTAPAY, MOBILE_WALLET, OTHER) [optional]:");
    const method = methodStr?.trim() ? methodStr.trim() : undefined;
    const notes = prompt("Completion notes (optional):") ?? undefined;
    setActionLoading(true);
    try {
      await recordAdminCompletion(id, notes, method, ref);
      await load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t("ad.payoutTitle")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("ad.payoutSubtitle")}</p>
        </div>
        <Button
          size="sm"
          onClick={runReconcile}
          disabled={actionLoading || loading}
        >
          {t("ad.payoutReconcile")}
        </Button>
      </div>

      {stats && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t("ad.payoutStats.total")} value={String(stats.total)} icon={<IconWallet width={18} height={18} />} />
          <StatCard label={t("ad.payoutStats.completed")} value={String(stats.completed)} icon={<IconWallet width={18} height={18} />} />
          <StatCard
            label={t("ad.payoutStats.manualReview")}
            value={String(stats.manualReview)}
            icon={<IconWallet width={18} height={18} />}
          />
          <StatCard
            label={t("ad.payoutStats.successRate")}
            value={`${stats.successRate}%`}
            icon={<IconWallet width={18} height={18} />}
          />
          <StatCard
            label={t("ad.payoutStats.processing")}
            value={String(stats.processing)}
            icon={<IconWallet width={18} height={18} />}
          />
          <StatCard label={t("ad.payoutStats.failed")} value={String(stats.failed)} icon={<IconWallet width={18} height={18} />} />
          <StatCard
            label={t("ad.payoutStats.volume24h")}
            value={`$${stats.volume24h.toLocaleString()}`}
            icon={<IconWallet width={18} height={18} />}
          />
          <StatCard
            label={t("ad.payoutStats.volume30d")}
            value={`$${stats.volume30d.toLocaleString()}`}
            icon={<IconWallet width={18} height={18} />}
          />
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  statusFilter === status
                    ? "bg-electric-500 text-white border-electric-500"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {status === "ALL"
                  ? t("ad.payoutFilterAll")
                  : status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
            {loading ? "…" : "Refresh"}
          </Button>
        </div>

        {error && <p className="p-4 text-sm text-rose-500">{error}</p>}

        {loading && withdrawals.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading payouts…</p>
        ) : withdrawals.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">No payouts found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">Engineer</th>
                  <th className="text-start p-3 font-semibold">Amount</th>
                  <th className="text-start p-3 font-semibold">Type</th>
                  <th className="text-start p-3 font-semibold">Method</th>
                  <th className="text-start p-3 font-semibold">Status</th>
                  <th className="text-start p-3 font-semibold">Details</th>
                  <th className="text-start p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-slate-100 dark:border-slate-800/80"
                  >
                    <td className="p-3">
                      <p className="font-semibold">{w.user.name}</p>
                      <p className="text-xs text-slate-500">{w.user.email}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTimestamp(w.createdAt)}
                      </p>
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(w.amount)}
                    </td>
                    <td className="p-3">
                      <Badge color={w.method === "IBAN" ? "blue" : "slate"}>
                        {w.method === "IBAN" ? "International" : "Paymob"}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge color="slate">{w.method}</Badge>
                      <p className="text-xs font-mono mt-1">{w.accountNumber}</p>
                    </td>
                    <td className="p-3">
                      <Badge color={statusColor(w.status)}>{w.status}</Badge>
                      {(w.failureReason || w.adminNotes) && (
                        <p className="text-xs text-slate-500 mt-1 max-w-[180px] truncate">
                          {w.failureReason ?? w.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-3 text-xs font-mono text-slate-500">
                      {w.paymobTransactionId ? (
                        <span title={w.paymobTransactionId}>
                          {w.paymobTransactionId.slice(0, 12)}…
                        </span>
                      ) : w.method === "IBAN" ? (
                        <span className="text-slate-400">Manual</span>
                      ) : (
                        "—"
                      )}
                      {w.paymobDisbursementStatus && (
                        <p className="mt-1">{w.paymobDisbursementStatus}</p>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAudit(w.id)}
                        >
                          {t("ad.payoutAudit")}
                        </Button>
                        {["IBAN", "INSTAPAY", "E_WALLET"].includes(w.method) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-indigo-500"
                            onClick={() => handleRevealBankDetails(w.id)}
                            disabled={actionLoading}
                          >
                            View Details
                          </Button>
                        )}
                        {w.status === "PENDING_REVIEW" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(w.id)}
                              disabled={actionLoading}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500"
                              onClick={() => handleReject(w.id)}
                              disabled={actionLoading}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {w.status === "APPROVED" && (
                          <Button
                            size="sm"
                            onClick={() => handleInitiateTransfer(w.id)}
                            disabled={actionLoading}
                          >
                            Initiate Transfer
                          </Button>
                        )}
                        {(w.status === "TRANSFER_INITIATED" || w.status === "PROCESSING") && ["IBAN", "INSTAPAY", "E_WALLET"].includes(w.method) && (
                          <Button
                            size="sm"
                            onClick={() => handleRecordCompletion(w.id)}
                            disabled={actionLoading}
                          >
                            Mark Completed
                          </Button>
                        )}
                        {w.status === "FAILED_NEEDS_MANUAL_REVIEW" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleResolve(w.id, "mark_completed")}
                              disabled={actionLoading}
                            >
                              {t("ad.payoutComplete")}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleResolve(w.id, "release_funds")}
                              disabled={actionLoading}
                            >
                              {t("ad.payoutRelease")}
                            </Button>
                          </>
                        )}
                        {(w.status === "PENDING" ||
                          w.status === "PENDING_REVIEW" ||
                          w.status === "SUBMITTED" ||
                          w.status === "PROCESSING") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-500"
                            onClick={() => handleCancel(w.id)}
                            disabled={actionLoading}
                          >
                            {t("ad.payoutCancel")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {auditOpen !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold">
                {t("ad.payoutAudit")} #{auditOpen}
              </h3>
              <button
                type="button"
                onClick={() => setAuditOpen(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 text-sm">
              {auditEntries.length === 0 ? (
                <p className="text-slate-500">No audit entries.</p>
              ) : (
                auditEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">{entry.event}</span>
                      <span className="text-xs text-slate-500">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </div>
                    {entry.statusBefore || entry.statusAfter ? (
                      <p className="text-xs text-slate-500 mt-1">
                        {entry.statusBefore ?? "—"} → {entry.statusAfter ?? "—"}
                      </p>
                    ) : null}
                    {entry.message && (
                      <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                        {entry.message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {bankDetails !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold">
                Bank Details — Withdrawal #{bankDetails.withdrawalId}
              </h3>
              <button
                type="button"
                onClick={() => setBankDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>This access has been logged in the audit trail.</span>
              </div>
              {(["accountHolderName", "iban", "swiftBic", "bankAddress", "instapayAccount", "walletProvider", "walletNumber"] as const).map((field) => (
                bankDetails.data[field] && (
                  <div key={field}>
                    <p className="text-xs font-medium text-slate-500 uppercase">
                      {field.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p className="font-mono text-sm mt-0.5 select-all">
                      {bankDetails.data[field]}
                    </p>
                  </div>
                )
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
