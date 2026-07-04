"use client";

import { useEffect, useState } from "react";
import { Card, Button, StatCard, Badge } from "@/components/UI";
import { AreaChart, BarChart, ChartMeta, seriesStats } from "@/components/Charts";
import { IconUsers, IconWallet } from "@/components/Icons";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import { fetchAdminAnalytics, type AnalyticsData } from "../api/admin.api";

const CHART_COLOR = "#196481";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function monthLabel(monthKey: string) {
  const [, m] = monthKey.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[Number(m) - 1] ?? monthKey;
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdminAnalytics() {
  const { t } = useI18n();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const signupSeries = analytics?.dailySignups.map((d) => d.count) ?? [];
  const gmvSeries = analytics?.dailyGmv.map((d) => d.amount) ?? [];
  const commissionSeries = analytics?.dailyCommission.map((d) => d.amount) ?? [];
  const dailyLabels = analytics?.dailySignups.map((d) => shortDate(d.date)) ?? [];
  const totalSignups30d = signupSeries.reduce((sum, n) => sum + n, 0);
  const totalGmv30d = gmvSeries.reduce((sum, n) => sum + n, 0);
  const totalRevenue30d = commissionSeries.reduce((sum, n) => sum + n, 0);
  const signupStats = seriesStats(signupSeries);
  const gmvStats = seriesStats(gmvSeries);
  const revenueStats = seriesStats(commissionSeries);
  const monthlyLabels = analytics?.monthlySignups.map((m) => monthLabel(m.month)) ?? [];
  const monthlySignupData = analytics?.monthlySignups.map((m) => m.count) ?? [];
  const monthlyStats = seriesStats(monthlySignupData);
  const activeDays = signupSeries.filter((n, i) => n > 0 || gmvSeries[i] > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Platform analytics</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Last 30 days of activity and 6-month trends from live database records.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loading && !analytics ? (
        <Card className="p-12 text-center text-slate-500 text-sm">Loading analytics…</Card>
      ) : analytics ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Signups (30d)"
              value={String(totalSignups30d)}
              change={`${analytics.totalSignups} total users`}
              accent="up"
              icon={<IconUsers width={20} height={20} />}
            />
            <StatCard
              label="GMV (30d)"
              value={formatMoney(totalGmv30d)}
              change={`${formatMoney(analytics.totalGmv)} all time`}
              accent="up"
              icon={<IconWallet width={20} height={20} />}
            />
            <StatCard
              label={t("ad.revYTD")}
              value={formatMoney(analytics.revenueYtd)}
              change={`${analytics.yoyGrowth >= 0 ? "+" : ""}${analytics.yoyGrowth}% ${t("ad.yoy")}`}
              accent={analytics.yoyGrowth >= 0 ? "up" : "down"}
              icon={<IconWallet width={20} height={20} />}
            />
            <StatCard
              label={t("ad.netMargin")}
              value={`${analytics.netMargin}%`}
              change={`Fee ${analytics.platformFeePercent}%`}
              accent="up"
              icon={<IconWallet width={20} height={20} />}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold">Daily signups</h3>
                  <p className="text-sm text-slate-500">Last 30 days</p>
                </div>
                <Badge color="blue">{totalSignups30d} new</Badge>
              </div>
              <div className="text-electric-500">
                <AreaChart
                  data={signupSeries}
                  labels={dailyLabels}
                  color={CHART_COLOR}
                  height={180}
                  formatValue={(n) => String(Math.round(n))}
                  yAxisLabel="Users"
                />
                <ChartMeta
                  items={[
                    { label: "30-day total", value: String(totalSignups30d) },
                    { label: "Best day", value: String(signupStats.max) },
                    { label: "Daily avg", value: signupStats.avg.toFixed(1) },
                    { label: "Active days", value: String(activeDays) },
                  ]}
                  note="Count of new accounts created each day."
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold">Daily GMV</h3>
                  <p className="text-sm text-slate-500">Funded & released payments</p>
                </div>
                <Badge color="green">{formatMoney(totalGmv30d)}</Badge>
              </div>
              <div className="text-electric-500">
                <AreaChart
                  data={gmvSeries}
                  labels={dailyLabels}
                  color={CHART_COLOR}
                  height={180}
                  formatValue={(n) => formatMoney(n)}
                  yAxisLabel="EGP"
                />
                <ChartMeta
                  items={[
                    { label: "30-day GMV", value: formatMoney(totalGmv30d) },
                    { label: "Best day", value: formatMoney(gmvStats.max) },
                    { label: "Daily avg", value: formatMoney(gmvStats.avg) },
                    { label: "All-time GMV", value: formatMoney(analytics.totalGmv) },
                  ]}
                  note="Sum of funded and released payment amounts per day."
                />
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold">Platform revenue</h3>
                  <p className="text-sm text-slate-500">Daily service fees (30d)</p>
                </div>
                <Badge color="violet">{formatMoney(analytics.revenueYtd)} YTD</Badge>
              </div>
              <div className="text-electric-500">
                <AreaChart
                  data={commissionSeries}
                  labels={dailyLabels}
                  color={CHART_COLOR}
                  height={180}
                  formatValue={(n) => formatMoney(n)}
                  yAxisLabel="EGP"
                />
                <ChartMeta
                  items={[
                    { label: "30-day fees", value: formatMoney(totalRevenue30d) },
                    { label: "Best day", value: formatMoney(revenueStats.max) },
                    { label: "Daily avg", value: formatMoney(revenueStats.avg) },
                    { label: "YTD revenue", value: formatMoney(analytics.revenueYtd) },
                  ]}
                  note={`CLINKA service fee at ${analytics.platformFeePercent}%. Net margin ${analytics.netMargin}% of GMV.`}
                />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold">{t("ad.userGrowth")}</h3>
                  <p className="text-sm text-slate-500">{t("ad.newSignups")} · 6 months</p>
                </div>
              </div>
              <div className="text-electric-500">
                <BarChart
                  data={monthlySignupData}
                  labels={monthlyLabels}
                  color={CHART_COLOR}
                  height={180}
                  formatValue={(n) => String(Math.round(n))}
                />
                <ChartMeta
                  items={[
                    { label: "6-month total", value: String(monthlyStats.total) },
                    { label: "Best month", value: String(monthlyStats.max) },
                    { label: "Monthly avg", value: monthlyStats.avg.toFixed(1) },
                    {
                      label: "Peak month",
                      value: monthlyLabels[monthlyStats.maxIndex] ?? "—",
                    },
                  ]}
                  breakdown={analytics.monthlySignups.map((m) => ({
                    label: monthLabel(m.month),
                    value: `${m.count} users`,
                  }))}
                />
              </div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold">Daily breakdown</h3>
              <p className="text-sm text-slate-500 mt-0.5">Signups and GMV per day (last 30 days)</p>
            </div>
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-950">
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 text-xs uppercase">
                    <th className="text-start p-3 font-semibold">Date</th>
                    <th className="text-start p-3 font-semibold">Signups</th>
                    <th className="text-start p-3 font-semibold">GMV</th>
                    <th className="text-start p-3 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(analytics.dailySignups ?? [])].reverse().map((signup) => {
                    const gmvEntry = analytics.dailyGmv.find((g) => g.date === signup.date);
                    const revEntry = analytics.dailyCommission.find((c) => c.date === signup.date);
                    const hasActivity = signup.count > 0 || (gmvEntry?.amount ?? 0) > 0;
                    return (
                      <tr
                        key={signup.date}
                        className={cn(
                          "border-b border-slate-100 dark:border-slate-800/80",
                          !hasActivity && "opacity-60",
                        )}
                      >
                        <td className="p-3 font-medium">
                          {new Date(signup.date + "T00:00:00").toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-electric-600 dark:text-electric-400">
                            {signup.count}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatMoney(gmvEntry?.amount ?? 0)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            {formatMoney(revEntry?.amount ?? 0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
