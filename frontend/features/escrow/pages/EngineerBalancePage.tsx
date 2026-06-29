"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconShield, IconWallet, IconClock } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useEngineerBalance } from "../hooks/useEngineerBalance";
import { formatMoney } from "../utils/formatMoney";
import { createEngineerWithdrawal } from "../api/payments.api";
import type { EngineerPaymentStatus } from "../types";

function statusBadgeColor(
  status: EngineerPaymentStatus,
): "green" | "amber" | "blue" | "slate" {
  switch (status) {
    case "paid":
      return "green";
    case "in_progress":
      return "blue";
    default:
      return "slate";
  }
}

export function EngineerBalancePage() {
  const { t } = useI18n();
  const { balance, loading, error, refetch } = useEngineerBalance();
  const [withdrawing, setWithdrawing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"Instapay" | "Digital Wallet">("Instapay");
  const [accountNumber, setAccountNumber] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const statusLabel = (status: EngineerPaymentStatus) => {
    const key = `bal.status.${status}` as const;
    return t(key);
  };

  const openWithdrawalModal = () => {
    setAmount(String(balance.availableBalance));
    setMethod("Instapay");
    setAccountNumber("");
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0 || withdrawAmount > balance.availableBalance) {
      setModalError("Invalid amount.");
      return;
    }
    if (!accountNumber.trim()) {
      setModalError("Please enter your account details.");
      return;
    }

    setWithdrawing(true);
    setModalError("");
    try {
      await createEngineerWithdrawal({
        amount: withdrawAmount,
        method,
        accountNumber: accountNumber.trim(),
      });
      setModalSuccess(t("bal.withdrawSuccess"));
      setTimeout(() => {
        setIsModalOpen(false);
        refetch();
      }, 2000);
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? err.message ?? t("bal.withdrawError"));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("bal.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {t("bal.subtitle")}
        </p>
      </div>

      <Card className="p-5 bg-gradient-to-br from-navy-900 to-electric-700 text-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <p className="text-sm text-white/70">{t("bal.available")}</p>
          <p className="text-3xl font-bold mt-1">
            {loading ? "…" : formatMoney(balance.availableBalance)}
          </p>
          <p className="text-xs text-white/60 mt-2">{t("bal.availableHint")}</p>
        </div>
        <Button 
          onClick={openWithdrawalModal} 
          disabled={loading || withdrawing || balance.availableBalance <= 0}
          className="bg-white text-navy-900 hover:bg-slate-100"
        >
          {withdrawing ? "Processing..." : "Withdraw Funds"}
        </Button>
      </Card>

      {error && (
        <Card className="p-4 text-sm text-rose-500 flex justify-between gap-3">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </Card>
      )}

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <StatCard
          label="Pending Balance"
          value={loading ? "…" : formatMoney(balance.pendingBalance)}
          icon={<IconClock width={20} height={20} className="text-purple-500" />}
        />
        <StatCard
          label={t("bal.secured")}
          value={loading ? "…" : formatMoney(balance.securedBalance)}
          icon={<IconShield width={20} height={20} className="text-blue-500" />}
        />
        <StatCard
          label={t("bal.awaitingClient")}
          value={loading ? "…" : formatMoney(balance.awaitingClientPayment)}
          icon={<IconWallet width={20} height={20} className="text-slate-500" />}
        />
      </div>

      <Card className="p-5">
        <h2 className="font-bold text-sm">{t("bal.howTitle")}</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside">
          <li>{t("bal.how1")}</li>
          <li>{t("bal.how2")}</li>
          <li>{t("bal.how3")}</li>
          <li>{t("bal.how4")}</li>
        </ol>
      </Card>

      {!loading && balance.withdrawalRequests && balance.withdrawalRequests.length > 0 && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">Withdrawal History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">Date</th>
                  <th className="text-start p-3 font-semibold">Amount</th>
                  <th className="text-start p-3 font-semibold">Method</th>
                  <th className="text-start p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {balance.withdrawalRequests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(req.amount)}
                    </td>
                    <td className="p-3">
                      <p>{req.method}</p>
                      <p className="text-xs text-slate-500">{req.accountNumber}</p>
                    </td>
                    <td className="p-3">
                      <Badge color={req.status === "COMPLETED" ? "green" : req.status === "REJECTED" ? "rose" : req.status === "PROCESSING" ? "blue" : "amber"}>
                        {req.status}
                      </Badge>
                      {req.adminNotes && <p className="text-xs mt-1 text-slate-500">Note: {req.adminNotes}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          {t("common.loading")}
        </Card>
      ) : balance.transactions.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <p>{t("bal.empty")}</p>
          <Link href="/projects" className="inline-block mt-4">
            <Button variant="secondary">{t("side.findProjects")}</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">{t("bal.transactions")}</h2>
          </div>
          {balance.transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold">{tx.projectTitle}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatMoney(tx.netAmount)}{" "}
                  <span className="text-xs">
                    ({t("bal.netAfterFee")})
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusBadgeColor(tx.status)}>
                  {statusLabel(tx.status)}
                </Badge>
                <Link href={`/messages?project=${tx.projectId}`}>
                  <Button size="sm" variant="secondary">
                    {t("bal.openChat")}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {t("bal.withdrawTitle")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("bal.withdrawSub")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={submitWithdrawal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-600 dark:text-red-400">
                  {modalError}
                </div>
              )}
              {modalSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
                  {modalSuccess}
                </div>
              )}

              {/* Amount field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    {t("bal.withdrawAmount")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(balance.availableBalance))}
                    className="text-electric-500 hover:text-electric-600 dark:text-electric-400 font-semibold"
                  >
                    {t("bal.withdrawAmountMax")} ({formatMoney(balance.availableBalance)})
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>

              {/* Method field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t("bal.withdrawMethod")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod("Instapay")}
                    className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                      method === "Instapay"
                        ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-950 dark:text-white">Instapay</span>
                    <span className="text-[10px] text-slate-500">Instant IPA / Bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("Digital Wallet")}
                    className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                      method === "Digital Wallet"
                        ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-950 dark:text-white">Digital Wallet</span>
                    <span className="text-[10px] text-slate-500">Vodafone, Orange, Cash</span>
                  </button>
                </div>
              </div>

              {/* Account details field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t("bal.withdrawAccount")}
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    method === "Instapay"
                      ? "e.g. name@instapay or Bank Acc/IBAN"
                      : "e.g. 01xxxxxxxxx"
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>

              {/* Notice Banner */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 flex items-start gap-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</span>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                  {t("bal.withdrawNotice")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={withdrawing || !amount || !accountNumber}>
                  {withdrawing ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
