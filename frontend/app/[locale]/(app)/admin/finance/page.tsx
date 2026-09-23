"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, StatCard, Button } from "@/components/UI";
import { IconChart } from "@/components/Icons";
import { fetchFinanceOverview, type FinanceOverview } from "@/features/admin/api/admin.finance.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

export default function FinanceOverviewPage() {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await fetchFinanceOverview());
    } catch (err: any) {
      setError(err.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading overview...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Action Required Banner */}
      {(data.pendingManualPayments > 0 || data.pendingWithdrawals > 0 || data.failedTransactions > 0) && (
        <Card className="border-rose-500/30 bg-rose-500/10 p-5">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 mb-3">
            <h2 className="font-bold text-lg">⚠️ ACTION REQUIRED</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {data.pendingManualPayments > 0 && (
              <Link href="/admin/finance/payments" className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-rose-100 dark:border-rose-900 flex-1 hover:border-rose-300 transition">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Manual Payments</p>
                <p className="text-2xl font-bold text-rose-600">{data.pendingManualPayments} pending verification</p>
              </Link>
            )}
            {data.pendingWithdrawals > 0 && (
              <Link href="/admin/finance/payouts" className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-rose-100 dark:border-rose-900 flex-1 hover:border-rose-300 transition">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Withdrawal Requests</p>
                <p className="text-2xl font-bold text-rose-600">{data.pendingWithdrawals} waiting for processing</p>
              </Link>
            )}
            {data.failedTransactions > 0 && (
              <Link href="/admin/finance/payouts?status=FAILED_NEEDS_MANUAL_REVIEW" className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-rose-100 dark:border-rose-900 flex-1 hover:border-rose-300 transition">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Failed Transactions</p>
                <p className="text-2xl font-bold text-rose-600">{data.failedTransactions} requiring attention</p>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Payment Overview */}
      <section>
        <h3 className="font-bold text-lg mb-3">Payment Overview</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Payments" value={String(data.totalPayments)} icon={<IconChart width={18} height={18} />} />
          <StatCard label="Total Money Received" value={formatMoney(data.totalMoneyReceived)} icon={<IconChart width={18} height={18} />} />
          <StatCard label="Pending Manual" value={String(data.pendingManualPayments)} icon={<IconChart width={18} height={18} />} />
        </div>
      </section>

      {/* Payout & Earnings Overview */}
      <section>
        <h3 className="font-bold text-lg mb-3">Payout Overview</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Platform Commissions" value={formatMoney(data.totalPlatformCommissions)} icon={<IconChart width={18} height={18} />} />
          <StatCard label="Engineer Earnings" value={formatMoney(data.totalEngineerEarnings)} icon={<IconChart width={18} height={18} />} />
          <StatCard label="Pending Withdrawals" value={String(data.pendingWithdrawals)} icon={<IconChart width={18} height={18} />} />
        </div>
      </section>
    </div>
  );
}
