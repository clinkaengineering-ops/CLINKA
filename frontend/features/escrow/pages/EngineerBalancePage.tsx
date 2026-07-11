"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconShield, IconWallet, IconClock } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useEngineerBalance } from "../hooks/useEngineerBalance";
import { formatMoney } from "../utils/formatMoney";
import { createEngineerWithdrawal } from "../api/payments.api";
import type { AutoWithdrawalChannel, EngineerPaymentStatus, WithdrawalRequestStatus } from "../types";
import { getApiErrorMessage } from "@/lib/apiErrors";
import {
  isValidIban,
  isValidSwiftBic,
} from "@/lib/validation/iban";
import {
  isValidAccountHolderName,
  normalizeAccountHolderName,
} from "@/lib/validation/accountHolderName";
import {
  ALL_COUNTRIES,
  isValidCountryCode,
  normalizeCountryCode,
} from "@/lib/validation/countryCodes";

const PAYMOB_BANK_MIN_EGP = 112;

const BANK_OPTIONS = [
  { code: "CIB", label: "Commercial International Bank (CIB)" },
  { code: "NBE", label: "National Bank of Egypt (NBE)" },
  { code: "MISR", label: "Banque Misr" },
  { code: "AAIB", label: "Arab African International Bank (AAIB)" },
  { code: "HSBC", label: "HSBC Egypt" },
  { code: "QNB", label: "QNB Alahli" },
  { code: "ADIB", label: "Abu Dhabi Islamic Bank" },
  { code: "FAB", label: "First Abu Dhabi Bank" },
];

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

function withdrawalBadgeColor(
  status: WithdrawalRequestStatus,
): "green" | "amber" | "blue" | "slate" | "rose" {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "FAILED_NEEDS_MANUAL_REVIEW":
      return "rose";
    case "PROCESSING":
    case "SUBMITTED":
      return "blue";
    default:
      return "amber";
  }
}

export function EngineerBalancePage() {
  const { t } = useI18n();
  const { balance, loading, error, refetch } = useEngineerBalance();
  const [withdrawing, setWithdrawing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<AutoWithdrawalChannel>("mobile_wallet");
  const [msisdn, setMsisdn] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("CIB");
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const [region, setRegion] = useState<"inside_egypt" | "outside_egypt">("inside_egypt");
  const [ibanBankName, setIbanBankName] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [country, setCountry] = useState("");

  const statusLabel = (status: EngineerPaymentStatus) => {
    const key = `bal.status.${status}` as const;
    return t(key);
  };

  const withdrawalStatusLabel = (status: WithdrawalRequestStatus) => {
    const key = `bal.withdrawStatus.${status}` as const;
    return t(key);
  };

  const spendable = balance.spendableBalance ?? balance.availableBalance;

  const openWithdrawalModal = () => {
    setAmount(String(spendable));
    setChannel("mobile_wallet");
    setMsisdn("");
    setAccountNumber("");
    setBankCode("CIB");
    setFullName("");
    setNationalId("");
    setModalError("");
    setModalSuccess("");
    setRegion("inside_egypt");
    setIbanBankName("");
    setSwiftBic("");
    setBankAddress("");
    setCountry("");
    setIsModalOpen(true);
  };

  const submitAutoWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Math.round(Number(amount) * 100) / 100;
    if (
      isNaN(withdrawAmount) ||
      withdrawAmount <= 0 ||
      withdrawAmount > spendable
    ) {
      setModalError(t("bal.withdrawInvalidAmount"));
      return;
    }

    if (region === "inside_egypt") {
      if (!nationalId.trim()) {
        setModalError(t("bal.withdrawNationalIdRequired"));
        return;
      }
      if (!/^\d{14}$/.test(nationalId.trim())) {
        setModalError(t("bal.withdrawNationalIdInvalid"));
        return;
      }
      if (channel === "mobile_wallet") {
        const phone = msisdn.trim();
        if (!phone) {
          setModalError(t("bal.withdrawWalletRequired"));
          return;
        }
        if (!/^01[012]\d{8}$/.test(phone.replace(/\D/g, ""))) {
          setModalError(t("bal.withdrawWalletInvalid"));
          return;
        }
      }
      if (channel === "bank_transfer") {
        if (withdrawAmount < PAYMOB_BANK_MIN_EGP) {
          setModalError(t("bal.withdrawBankMin"));
          return;
        }
        if (!accountNumber.trim()) {
          setModalError(t("bal.withdrawEgyptIbanRequired"));
          return;
        }
        const normalizedAccount = accountNumber.trim().replace(/\s+/g, "").toUpperCase();
        if (normalizedAccount.length < 15 || normalizedAccount.length > 34) {
          setModalError(t("bal.withdrawEgyptIbanLength"));
          return;
        }
        if (!normalizedAccount.startsWith("EG")) {
          setModalError(t("bal.withdrawEgyptIbanPrefix"));
          return;
        }
        if (!isValidIban(normalizedAccount)) {
          setModalError(t("bal.withdrawEgyptIbanInvalid"));
          return;
        }
        if (!isValidAccountHolderName(fullName)) {
          setModalError(t("bal.withdrawAccountNameInvalid"));
          return;
        }
      }
    } else {
      const iban = accountNumber.trim().replace(/\s+/g, "");
      if (!iban) {
        setModalError(t("bal.withdrawIbanRequired"));
        return;
      }
      if (!isValidIban(iban)) {
        setModalError(t("bal.withdrawIbanInvalid"));
        return;
      }
      if (!isValidAccountHolderName(fullName)) {
        setModalError(t("bal.withdrawAccountNameInvalid"));
        return;
      }
      if (!ibanBankName.trim()) {
        setModalError(t("bal.withdrawBankNameRequired"));
        return;
      }
      const normalizedCountry = normalizeCountryCode(country);
      if (!isValidCountryCode(normalizedCountry)) {
        setModalError(t("bal.withdrawCountryInvalid"));
        return;
      }
      if (swiftBic.trim() && !isValidSwiftBic(swiftBic.trim())) {
        setModalError(t("bal.withdrawSwiftInvalid"));
        return;
      }
    }

    setWithdrawing(true);
    setModalError("");
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `wd-${Date.now()}`;
    try {
      const payload = region === "inside_egypt" 
        ? {
            payoutMethod: "PAYMOB" as const,
            amount: withdrawAmount,
            channel,
            msisdn: channel === "mobile_wallet" ? msisdn.trim() : undefined,
            accountNumber: channel === "bank_transfer" ? accountNumber.trim().replace(/\s+/g, "").toUpperCase() : undefined,
            bankCode: channel === "bank_transfer" ? bankCode : undefined,
            fullName: channel === "bank_transfer" ? normalizeAccountHolderName(fullName) : undefined,
            nationalId: nationalId.trim(),
          }
        : {
            payoutMethod: "IBAN" as const,
            amount: withdrawAmount,
            accountHolderName: normalizeAccountHolderName(fullName),
            iban: accountNumber.trim().replace(/\s+/g, ""),
            bankName: ibanBankName.trim(),
            country: normalizeCountryCode(country),
            swiftBic: swiftBic.trim() || undefined,
            bankAddress: bankAddress.trim() || undefined,
          };

      const result = await createEngineerWithdrawal(payload, idempotencyKey);

      if (result.status === "COMPLETED") {
        setModalSuccess(t("bal.withdrawSuccessInstant"));
      } else if (result.status === "PROCESSING") {
        setModalSuccess(t("bal.withdrawSuccessProcessing"));
      } else if (["PENDING", "PENDING_REVIEW", "SUBMITTED"].includes(result.status)) {
        setModalSuccess(
          result.status === "PENDING_REVIEW"
            ? t("bal.withdrawSuccessInternational")
            : t("bal.withdrawSuccess"),
        );
      } else {
        setModalError(
          result.paymobStatusDescription ??
            result.failureReason ??
            t("bal.withdrawError"),
        );
        return;
      }

      setTimeout(() => {
        setIsModalOpen(false);
        refetch();
      }, 2000);
    } catch (err: unknown) {
      setModalError(getApiErrorMessage(err, t("bal.withdrawError")));
    } finally {
      setWithdrawing(false);
    }
  };

  /*
  OLD_WITHDRAWAL_START — Manual admin-reviewed withdrawal submit (commented out for Paymob auto-withdrawal)
  const [method, setMethod] = useState<"Instapay" | "Digital Wallet">("Instapay");
  const submitWithdrawal = async (e: React.FormEvent) => {
    ...
    await createEngineerWithdrawal({ amount, method, accountNumber });
  };
  OLD_WITHDRAWAL_END
  */

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
          <p className="text-sm text-white/70">{t("bal.spendable")}</p>
          <p className="text-3xl font-bold mt-1">
            {loading ? "…" : formatMoney(spendable)}
          </p>
          <p className="text-xs text-white/60 mt-2">{t("bal.spendableHint")}</p>
          {!loading && balance.heldInWithdrawals > 0 && (
            <p className="text-xs text-white/50 mt-1">
              {t("bal.heldInWithdrawals")}: {formatMoney(balance.heldInWithdrawals)}
            </p>
          )}
        </div>
        <Button
          onClick={openWithdrawalModal}
          disabled={loading || withdrawing || spendable <= 0}
          className="bg-white text-navy-900 hover:bg-slate-100"
        >
          {withdrawing ? t("bal.withdrawProcessing") : t("bal.withdraw")}
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <StatCard
          label={t("bal.available")}
          value={loading ? "…" : formatMoney(balance.availableBalance)}
          icon={<IconWallet width={20} height={20} className="text-emerald-500" />}
        />
        <StatCard
          label={t("bal.pendingBalance")}
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
            <h2 className="font-bold">{t("bal.withdrawHistory")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">{t("bal.colDate")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colAmount")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colMethod")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colStatus")}</th>
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
                      {req.paymobTransactionId && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Paymob: {req.paymobTransactionId}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge color={withdrawalBadgeColor(req.status)}>
                        {withdrawalStatusLabel(req.status)}
                      </Badge>
                      {(req.paymobStatusDescription || req.adminNotes || req.failureReason) && (
                        <p className="text-xs mt-1 text-slate-500">
                          {req.paymobStatusDescription ?? req.failureReason ?? req.adminNotes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && balance.walletHistory && balance.walletHistory.length > 0 && (
        <Card className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">{t("bal.ledger")}</h2>
            <p className="text-xs text-slate-500 mt-1">{t("bal.ledgerHint")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">{t("bal.colDate")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colType")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colAmount")}</th>
                  <th className="text-start p-3 font-semibold">{t("bal.colStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {balance.walletHistory.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <p>{t(`bal.ledgerType.${row.type}` as const)}</p>
                      {row.description && (
                        <p className="text-xs text-slate-500">{row.description}</p>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{formatMoney(row.amount)}</td>
                    <td className="p-3">
                      <Badge color={row.status === "COMPLETED" || row.status === "AVAILABLE" ? "green" : row.status === "REJECTED" ? "rose" : "amber"}>
                        {t(`bal.ledgerStatus.${row.status}` as const)}
                      </Badge>
                      {row.availableAt && row.status === "PENDING" && (
                        <p className="text-xs text-slate-500 mt-1">
                          {t("bal.availableOn")}: {new Date(row.availableAt).toLocaleDateString()}
                        </p>
                      )}
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
                  <span className="text-xs">({t("bal.netAfterFee")})</span>
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
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {region === "outside_egypt"
                    ? t("bal.withdrawTitleInternational")
                    : t("bal.withdrawTitle")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {region === "outside_egypt"
                    ? t("bal.withdrawSubInternational")
                    : t("bal.withdrawSubAuto")}
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

            <form onSubmit={submitAutoWithdrawal} className="p-6 space-y-4">
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

              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    {t("bal.withdrawAmount")}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(String(spendable))}
                    className="text-electric-500 hover:text-electric-600 dark:text-electric-400 font-semibold"
                  >
                    {t("bal.withdrawAmountMax")} ({formatMoney(spendable)})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={spendable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t("bal.withdrawLocation")}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRegion("inside_egypt")}
                    className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                      region === "inside_egypt"
                        ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                      {t("bal.withdrawInsideEgypt")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("bal.withdrawInsideEgyptHint")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegion("outside_egypt")}
                    className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                      region === "outside_egypt"
                        ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                      {t("bal.withdrawOutsideEgypt")}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {t("bal.withdrawOutsideEgyptHint")}
                    </span>
                  </button>
                </div>
              </div>

              {region === "inside_egypt" && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t("bal.withdrawMethod")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChannel("mobile_wallet")}
                      className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                        channel === "mobile_wallet"
                          ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-950 dark:text-white">
                        {t("bal.withdrawMobileWallet")}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Vodafone / Etisalat / Orange
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("bank_transfer")}
                      className={`p-3 rounded-lg border text-start transition-all flex flex-col gap-1 ${
                        channel === "bank_transfer"
                          ? "border-electric-500 bg-electric-50/10 ring-2 ring-electric-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-950 dark:text-white">
                        {t("bal.withdrawBankTransfer")}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {t("bal.withdrawBankTransferHint")}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {region === "inside_egypt" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t("bal.withdrawNationalId")}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder={t("bal.withdrawNationalIdPh")}
                    maxLength={14}
                    required
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              )}

              {region === "inside_egypt" ? (
                channel === "mobile_wallet" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t("bal.withdrawWalletNumber")}
                    </label>
                    <input
                      type="text"
                      value={msisdn}
                      onChange={(e) => setMsisdn(e.target.value)}
                      placeholder="010xxxxxxxx"
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawFullName")}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t("bal.withdrawBankFullNamePh")}
                        required
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      />
                      <p className="text-[10px] text-slate-500">
                        {t("bal.withdrawBankFullNameHint")}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawBank")}
                      </label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        {BANK_OPTIONS.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawEgyptIban")}
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                        placeholder={t("bal.withdrawEgyptIbanPh")}
                        required
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      />
                      <p className="text-[10px] text-slate-500">
                        {t("bal.withdrawEgyptIbanHint")}
                      </p>
                    </div>
                  </>
                )
              ) : (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t("bal.withdrawIban")}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
                      placeholder={t("bal.withdrawIbanPh")}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {t("bal.withdrawFullName")}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("bal.withdrawBankFullNamePh")}
                      required
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      {t("bal.withdrawBankFullNameHint")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawBankName")}
                      </label>
                      <input
                        type="text"
                        value={ibanBankName}
                        onChange={(e) => setIbanBankName(e.target.value)}
                        placeholder={t("bal.withdrawBankNamePh")}
                        required
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawSwift")}
                      </label>
                      <input
                        type="text"
                        value={swiftBic}
                        onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
                        placeholder={t("bal.withdrawSwiftPh")}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawCountry")}
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      >
                        <option value="">{t("bal.withdrawCountrySelect")}</option>
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("bal.withdrawBankAddress")}
                      </label>
                      <input
                        type="text"
                        value={bankAddress}
                        onChange={(e) => setBankAddress(e.target.value)}
                        placeholder={t("bal.withdrawBankAddressPh")}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 flex items-start gap-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</span>
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                  {region === "outside_egypt"
                    ? t("bal.withdrawNoticeInternational")
                    : t("bal.withdrawNoticeAuto")}
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={withdrawing}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={withdrawing || !amount}>
                  {withdrawing ? t("bal.withdrawProcessing") : t("bal.withdrawSubmitAuto")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
