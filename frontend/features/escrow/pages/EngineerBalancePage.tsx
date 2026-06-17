"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import { useEngineerBalance } from "../hooks/useEngineerBalance";
import { formatMoney } from "../utils/formatMoney";
import type { EngineerPaymentStatus } from "../types";

function statusBadgeColor(
  status: EngineerPaymentStatus,
): "green" | "amber" | "blue" | "slate" {
  switch (status) {
    case "paid":
      return "green";
    case "awaiting_release":
      return "amber";
    case "in_progress":
      return "blue";
    default:
      return "slate";
  }
}

export function EngineerBalancePage() {
  const { t } = useI18n();
  const { balance, loading, error, refetch } = useEngineerBalance();

  const statusLabel = (status: EngineerPaymentStatus) => {
    const key = `bal.status.${status}` as const;
    return t(key);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("bal.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {t("bal.subtitle")}
        </p>
      </div>

      <Card className="p-5 bg-gradient-to-br from-navy-900 to-electric-700 text-white">
        <p className="text-sm text-white/70">{t("bal.available")}</p>
        <p className="text-3xl font-bold mt-1">
          {loading ? "…" : formatMoney(balance.availableBalance)}
        </p>
        <p className="text-xs text-white/60 mt-2">{t("bal.availableHint")}</p>
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
        <Card className="p-4">
          <p className="text-slate-500">{t("bal.secured")}</p>
          <p className="text-xl font-bold mt-1">
            {loading ? "…" : formatMoney(balance.securedBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{t("bal.securedHint")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-500">{t("bal.awaitingRelease")}</p>
          <p className="text-xl font-bold mt-1">
            {loading ? "…" : formatMoney(balance.awaitingRelease)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t("bal.awaitingReleaseHint")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-slate-500">{t("bal.awaitingClient")}</p>
          <p className="text-xl font-bold mt-1">
            {loading ? "…" : formatMoney(balance.awaitingClientPayment)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t("bal.awaitingClientHint")}
          </p>
        </Card>
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
    </div>
  );
}
