"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "@/components/UI";
import { AreaChart, BarChart, Donut, ChartMeta, seriesStats } from "@/components/Charts";
import { fetchEngineerBalance } from "@/features/escrow/api/payments.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useI18n } from "@/i18n";
import type { EngineerBalanceSummary } from "@/features/escrow/types";
import type { MyBid } from "@/features/bids/api/bids.api";

const CHART_COLOR = "#196481";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

function monthLabel(monthKeyStr: string, locale: string) {
  const [year, month] = monthKeyStr.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en",
    { month: "short" },
  );
}

export function EngineerDashboardAnalytics({ bids }: { bids: MyBid[] }) {
  const { t, lang } = useI18n();
  const [balance, setBalance] = useState<EngineerBalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineerBalance()
      .then(setBalance)
      .catch(() => setBalance(null))
      .finally(() => setLoading(false));
  }, []);

  const earningsData = useMemo(() => {
    const window = lastNMonths(6);
    const totals: Record<string, number> = {};
    balance?.transactions
      .filter((tx) => tx.status === "paid")
      .forEach((tx) => {
        const key = monthKey(new Date(tx.createdAt));
        totals[key] = (totals[key] ?? 0) + tx.netAmount;
      });
    const amounts = window.map((m) => totals[m] ?? 0);
    const labels = window.map((m) => monthLabel(m, lang));
    return { amounts, labels, stats: seriesStats(amounts) };
  }, [balance, lang]);

  const bidLabels = [t("ed.bid.pending"), t("ed.bid.accepted"), t("ed.bid.rejected")];
  const bidCounts = [
    bids.filter((b) => b.status === "PENDING").length,
    bids.filter((b) => b.status === "ACCEPTED").length,
    bids.filter((b) => b.status === "REJECTED").length,
  ];

  const secured = balance?.securedBalance ?? 0;
  const available = balance?.availableBalance ?? 0;
  const pending = balance?.pendingBalance ?? 0;
  const awaiting = balance?.awaitingClientPayment ?? 0;
  const walletTotal = secured + available + pending + awaiting;
  const utilPct = walletTotal > 0 ? Math.round((secured / walletTotal) * 100) : 0;
  const periodEarnings = earningsData.amounts.reduce((s, n) => s + n, 0);

  if (loading && !balance) {
    return <div className="animate-pulse h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-bold">{t("ed.earnings")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("ed.earningsDesc6m")}</p>
            </div>
            <Badge color="green">
              {formatMoney(balance?.availableBalance ?? 0)} {t("ed.availableBadge")}
            </Badge>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {formatMoney(periodEarnings)}{" "}
              <span className="text-base font-medium text-slate-500">
                {t("ed.sixMonthTotalLabel")}
              </span>
            </p>
          </div>
          <div className="mt-4 text-electric-500">
            <AreaChart
              data={earningsData.amounts}
              labels={earningsData.labels}
              color={CHART_COLOR}
              height={200}
              formatValue={(n) => formatMoney(n)}
              yAxisLabel="USD"
            />
            <ChartMeta
              items={[
                { label: t("ed.sixMonthNet"), value: formatMoney(periodEarnings) },
                { label: t("cd.bestMonth"), value: formatMoney(earningsData.stats.max) },
                { label: t("cd.monthlyAvg"), value: formatMoney(earningsData.stats.avg) },
                {
                  label: t("cd.peakMonth"),
                  value: earningsData.labels[earningsData.stats.maxIndex] ?? "—",
                },
              ]}
              breakdown={earningsData.labels.map((label, i) => ({
                label,
                value: formatMoney(earningsData.amounts[i]),
              }))}
              note={t("ed.earningsNote")}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="font-bold">{t("bal.wallet")}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("bal.walletDesc")}</p>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <Donut
              value={utilPct}
              color={CHART_COLOR}
              size={130}
              label={t("bal.securedLabel")}
              subLabel={formatMoney(secured)}
            />
          </div>
          <ChartMeta
            items={[
              { label: t("bal.available"), value: formatMoney(available) },
              { label: t("bal.pending"), value: formatMoney(pending) },
              { label: t("bal.secured"), value: formatMoney(secured) },
              { label: t("bal.awaitingClient"), value: formatMoney(awaiting) },
            ]}
            note={t("bal.walletUtilNote").replace("{percent}", String(utilPct))}
          />
        </Card>
      </div>

      <Card className="p-5">
        <div>
          <h2 className="font-bold">{t("side.myBids")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("ed.bidActivity")}</p>
        </div>
        <div className="mt-4 text-electric-500">
          <BarChart
            data={bidCounts}
            labels={bidLabels}
            color={CHART_COLOR}
            height={160}
            formatValue={(n) => String(Math.round(n))}
          />
          <ChartMeta
            items={bidLabels.map((label, i) => ({
              label,
              value: String(bidCounts[i]),
            }))}
            note={t("ed.bidActivityNote")}
          />
        </div>
      </Card>
    </div>
  );
}
