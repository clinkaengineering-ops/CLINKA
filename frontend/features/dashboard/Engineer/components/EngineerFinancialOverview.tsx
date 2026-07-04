"use client";

import Link from "next/link";
import { Card, StatCard, Badge } from "@/components/UI";
import { IconShield, IconWallet, IconClock } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { EngineerBalanceSummary, EngineerBalanceTransaction } from "@/features/escrow/types";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

export function EngineerFinancialOverview({
  balance,
  loading,
}: {
  balance: EngineerBalanceSummary | null;
  loading: boolean;
}) {
  const { t } = useI18n();

  if (loading || !balance) {
    return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  const recentTransactions = balance.transactions.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Earnings Banner */}
      <Card className="p-8 bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-0 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100 font-medium tracking-wide uppercase text-sm mb-1">
            {t("bal.available")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {formatMoney(balance.availableBalance)}
          </h2>
          <p className="text-emerald-50 mt-4 max-w-lg text-sm leading-relaxed opacity-90">
            {t("bal.availableHint")}
          </p>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
      </Card>

      {/* Financial Grid */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          label={t("bal.pendingBalance")}
          value={formatMoney(balance.pendingBalance)}
          icon={<IconClock width={20} height={20} className="text-purple-500" />}
        />
        <StatCard
          label={t("bal.secured")}
          value={formatMoney(balance.securedBalance)}
          icon={<IconShield width={20} height={20} className="text-blue-500" />}
        />
        <StatCard
          label={t("bal.awaitingClient")}
          value={formatMoney(balance.awaitingClientPayment)}
          icon={<IconWallet width={20} height={20} className="text-slate-500" />}
        />
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card>
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm">{t("bal.transactions")}</h3>
            <Link href="/balance" className="text-xs text-electric-600 hover:underline font-medium">
              {t("common.viewAll")}
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                <div>
                  <p className="text-sm font-semibold">{tx.projectTitle}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatMoney(tx.netAmount)}</p>
                  <div className="mt-1">
                    <TransactionBadge status={tx.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function TransactionBadge({ status }: { status: EngineerBalanceTransaction["status"] }) {
  const { t } = useI18n();
  switch (status) {
    case "paid":
      return <Badge color="green">{t("bal.status.paid")}</Badge>;
    case "in_progress":
      return <Badge color="blue">{t("bal.status.in_progress")}</Badge>;
    case "awaiting_payment":
      return <Badge color="slate">{t("bal.status.awaiting_payment")}</Badge>;
    case "refunded":
      return <Badge color="rose">{t("bal.status.refunded")}</Badge>;
    default:
      return <Badge color="slate">{status}</Badge>;
  }
}
