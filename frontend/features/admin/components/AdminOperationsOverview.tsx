"use client";

import Link from "next/link";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { AreaChart, BarChart, ChartMeta, seriesStats } from "@/components/Charts";
import {
  IconAlert,
  IconCheck,
  IconClose,
  IconShield,
  IconUsers,
  IconWallet,
} from "@/components/Icons";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useI18n } from "@/i18n";
import type {
  ActiveDispute,
  AdminStats,
  AnalyticsData,
  EscrowOverview,
  PendingVerification,
} from "../api/admin.api";

const CHART_COLOR = "#196481";

function monthLabel(monthKey: string) {
  const [, m] = monthKey.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return names[Number(m) - 1] ?? monthKey;
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatAge(hours: number) {
  if (hours >= 24) return `${Math.round(hours / 24)}d`;
  return `${hours}h`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function verificationPriority(v: PendingVerification): "High" | "Normal" {
  const ageHours = (Date.now() - new Date(v.submittedAt).getTime()) / (1000 * 60 * 60);
  if (v.documentType === "Syndicate Card" || ageHours >= 4) return "High";
  return "Normal";
}

function verificationAge(v: PendingVerification) {
  const hours = Math.max(1, Math.round((Date.now() - new Date(v.submittedAt).getTime()) / (1000 * 60 * 60)));
  if (hours >= 24) return `${Math.round(hours / 24)}d`;
  return `${hours}h`;
}

function disputeBadgeColor(color: ActiveDispute["statusColor"]) {
  switch (color) {
    case "green":
      return "green";
    case "red":
      return "rose";
    case "blue":
      return "blue";
    default:
      return "amber";
  }
}

interface Props {
  stats: AdminStats;
  analytics: AnalyticsData;
  escrow: EscrowOverview;
  disputes: ActiveDispute[];
  verifications: PendingVerification[];
  actionLoading: number | null;
  onApprove: (profileId: number) => void;
  onReject: (profileId: number) => void;
  onViewAllVerifications: () => void;
}

export function AdminOperationsOverview({
  stats,
  analytics,
  escrow,
  disputes,
  verifications,
  actionLoading,
  onApprove,
  onReject,
  onViewAllVerifications,
}: Props) {
  const { t } = useI18n();

  const userDelta = stats.newUsersLast30 - stats.newUsersPrev30;
  const userTrend =
    userDelta >= 0 ? `+${userDelta.toLocaleString()} last 30d` : `${userDelta.toLocaleString()} last 30d`;
  const gmvTrend =
    analytics.yoyGrowth > 0 ? `+${analytics.yoyGrowth}% YoY` : `${analytics.yoyGrowth}% YoY`;
  const revenueSeries = analytics.monthlyRevenue.map((m) => m.amount);
  const revenueLabels = analytics.monthlyRevenue.map((m) => monthLabel(m.month));
  const revenueStats = seriesStats(revenueSeries);
  const signupSeries = analytics.monthlySignups;
  const signupData = signupSeries.map((m) => m.count);
  const signupLabels = signupSeries.map((m) => monthLabel(m.month));
  const signupStats = seriesStats(signupData);
  const periodRevenue = revenueSeries.reduce((s, n) => s + n, 0);
  const escrowCapacity = escrow.totalInEscrow + escrow.released30d;
  const escrowHeldSeries = (escrow.dailyEscrowHeld ?? []).map((d) => d.amount);
  const escrowHeldLabels = (escrow.dailyEscrowHeld ?? []).map((d) => shortDate(d.date));
  const escrowHeldStats = seriesStats(escrowHeldSeries);
  const queuePreview = verifications.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <IconShield width={14} height={14} className="text-electric-500" />
            {t("ad.console")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t("ad.title")}</h1>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t("ad.totalUsers")}
          value={stats.totalUsers.toLocaleString()}
          change={userTrend}
          accent={userDelta >= 0 ? "up" : "down"}
          icon={<IconUsers width={20} height={20} />}
        />
        <StatCard
          label={t("ad.gmv")}
          value={formatMoney(stats.gmv)}
          change={gmvTrend}
          accent={analytics.yoyGrowth >= 0 ? "up" : "down"}
          icon={<IconWallet width={20} height={20} />}
        />
        <StatCard
          label={t("ad.verifPending")}
          value={String(stats.pendingVerifications)}
          change={stats.pendingVerifications > 0 ? `${stats.pendingVerifications} in queue` : "All clear"}
          accent="up"
          icon={<IconShield width={20} height={20} />}
        />
        <StatCard
          label={t("ad.disputesOpen")}
          value={String(stats.openSupportTickets)}
          change={stats.activeBans > 0 ? `${stats.activeBans} active bans` : "No escalations"}
          accent={stats.activeBans > 0 ? "down" : "up"}
          icon={<IconAlert width={20} height={20} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-bold">{t("ad.revenue")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{t("ad.feeSub")}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge color="slate">Service fee {Number(analytics.platformFeePercent)}%</Badge>
              <Badge color="violet">{t("ad.subscription")}</Badge>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {formatMoney(analytics.revenueYtd)}{" "}
              <span className="text-base font-medium text-slate-500">{t("ad.revYTD")}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {analytics.yoyGrowth >= 0 ? "+" : ""}
                {analytics.yoyGrowth}% {t("ad.yoy")}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {analytics.netMargin}% {t("ad.netMargin")}
              </span>
            </div>
          </div>
          <div className="mt-4 text-electric-500">
            <AreaChart
              data={revenueSeries}
              labels={revenueLabels}
              color={CHART_COLOR}
              height={200}
              formatValue={(n) => formatMoney(n)}
              yAxisLabel="USD"
            />
            <ChartMeta
              items={[
                { label: "6-month total", value: formatMoney(periodRevenue) },
                { label: "Best month", value: formatMoney(revenueStats.max) },
                { label: "Monthly avg", value: formatMoney(revenueStats.avg) },
                {
                  label: "Peak month",
                  value: revenueLabels[revenueStats.maxIndex] ?? "—",
                },
              ]}
              breakdown={analytics.monthlyRevenue.map((m) => ({
                label: monthLabel(m.month),
                value: formatMoney(m.amount),
              }))}
              note={`Platform commission collected from funded/released payments. Current fee: ${analytics.platformFeePercent}%. Net margin ${analytics.netMargin}% of GMV.`}
            />
          </div>
        </Card>

        <Card className="p-5">
          <div>
            <h2 className="font-bold">{t("ad.escExposure")}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("ad.fundsHeld")}</p>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">
              {formatMoney(escrow.totalInEscrow)}{" "}
              <span className="text-base font-medium text-slate-500">{t("ad.heldNow")}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("ad.escrowTrend")}</p>
          </div>
          <div className="mt-4 text-electric-500">
            <AreaChart
              data={escrowHeldSeries}
              labels={escrowHeldLabels}
              color={CHART_COLOR}
              height={180}
              formatValue={(n) => formatMoney(n)}
              yAxisLabel="USD"
            />
            <ChartMeta
              items={[
                { label: t("ad.heldNow"), value: formatMoney(escrow.totalInEscrow) },
                { label: t("ad.peak30d"), value: formatMoney(escrowHeldStats.max) },
                { label: t("ad.low30d"), value: formatMoney(escrowHeldStats.min) },
                { label: t("ad.utilised"), value: `${escrow.utilizationPercent}%` },
              ]}
              breakdown={[
                { label: t("ad.released30"), value: formatMoney(escrow.released30d) },
                { label: t("ad.refunded30"), value: formatMoney(escrow.refunded30d) },
              ]}
              note={`${t("ad.escrowChartNote")} ${formatMoney(escrowCapacity)}.`}
            />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div>
            <h2 className="font-bold">{t("ad.userGrowth")}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("ad.newSignups")}</p>
          </div>
          <div className="mt-4 text-electric-500">
            <BarChart
              data={signupData}
              labels={signupLabels}
              color={CHART_COLOR}
              height={180}
              formatValue={(n) => String(Math.round(n))}
            />
            <ChartMeta
              items={[
                { label: "6-month total", value: String(signupStats.total) },
                { label: "Best month", value: String(signupStats.max) },
                { label: "Monthly avg", value: signupStats.avg.toFixed(1) },
                {
                  label: "Peak month",
                  value: signupLabels[signupStats.maxIndex] ?? "—",
                },
              ]}
              breakdown={signupSeries.map((m) => ({
                label: monthLabel(m.month),
                value: `${m.count} users`,
              }))}
              note={`New user registrations per month. Last 30 days: ${stats.newUsersLast30} signups (${userDelta >= 0 ? "+" : ""}${userDelta} vs previous 30 days).`}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <div>
              <h2 className="font-bold">{t("ad.verifQueue")}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.pendingVerifications} pending · SLA 24h
              </p>
            </div>
            <button
              onClick={onViewAllVerifications}
              className="text-xs font-semibold text-electric-600 dark:text-electric-400 hover:underline bg-transparent border-0 cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {queuePreview.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">{t("ad.noPending")}</p>
            ) : (
              queuePreview.map((v) => {
                const priority = verificationPriority(v);
                return (
                  <div
                    key={v.profileId}
                    className="flex items-center justify-between gap-3 px-5 py-3 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-electric-500/10 text-sm font-bold text-electric-600 dark:text-electric-400">
                        {initials(v.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{v.name}</p>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1 mt-1">
                          {v.collegeIdUrl && (
                            <a href={v.collegeIdUrl} target="_blank" rel="noreferrer" className="text-electric-600 hover:underline">
                              College ID
                            </a>
                          )}
                          {v.certificateUrl && (
                            <a href={v.certificateUrl} target="_blank" rel="noreferrer" className="text-electric-600 hover:underline">
                              Certificate
                            </a>
                          )}
                          {v.syndicateCardUrl && (
                            <a href={v.syndicateCardUrl} target="_blank" rel="noreferrer" className="text-electric-600 hover:underline">
                              Syndicate
                            </a>
                          )}
                          <span>· {verificationAge(v)}</span>
                          {v.portfolios && v.portfolios.length > 0 && (
                            <>
                              <span>·</span>
                              <button
                                onClick={onViewAllVerifications}
                                className="text-electric-600 hover:underline bg-transparent border-0 cursor-pointer p-0 text-xs"
                              >
                                {v.portfolios.length} Portfolios
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={priority === "High" ? "rose" : "blue"}>{priority}</Badge>
                      <Button
                        size="sm"
                        icon={<IconCheck width={14} height={14} />}
                        disabled={actionLoading === v.profileId}
                        onClick={() => onApprove(v.profileId)}
                      >
                        {t("ad.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<IconClose width={14} height={14} />}
                        disabled={actionLoading === v.profileId}
                        onClick={() => onReject(v.profileId)}
                      >
                        {t("ad.reject")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold">{t("ad.activeDisputes")}</h2>
              <Badge color="rose">{stats.openSupportTickets} open</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">{t("ad.dCols.case")}</th>
                  <th className="px-5 py-3">{t("ad.dCols.parties")}</th>
                  <th className="px-5 py-3">{t("ad.dCols.amount")}</th>
                  <th className="px-5 py-3">{t("ad.dCols.status")}</th>
                  <th className="px-5 py-3">{t("ad.dCols.age")}</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No open support tickets
                    </td>
                  </tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                      <td className="px-5 py-3 font-mono">{d.caseId}</td>
                      <td className="px-5 py-3 max-w-[220px] truncate">{d.parties}</td>
                      <td className="px-5 py-3">
                        {d.amount != null ? formatMoney(d.amount) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={disputeBadgeColor(d.statusColor)}>{d.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatAge(d.ageHours)}</td>
                      <td className="px-5 py-3 flex gap-2">
                        {d.status === "OPEN" && (
                          <Button size="sm" variant="secondary" onClick={() => {
                            import("../api/admin.api").then(api => {
                              api.escalateDisputeAdmin(d.projectId).then(() => window.location.reload());
                            });
                          }}>
                            Escalate
                          </Button>
                        )}
                        {(d.status === "ESCALATED_TO_ADMIN" || d.status === "OPEN") && (
                          <>
                            <Button size="sm" onClick={() => {
                              const reason = prompt("Resolution note for Engineer Favor:");
                              if (!reason) return;
                              import("../api/admin.api").then(api => {
                                api.resolveDisputeAdmin(d.projectId, "ENGINEER", reason).then(() => window.location.reload());
                              });
                            }}>Eng. Favor</Button>
                            <Button size="sm" variant="danger" onClick={() => {
                              const reason = prompt("Resolution note for Client Favor (Manual Refund required):");
                              if (!reason) return;
                              import("../api/admin.api").then(api => {
                                api.resolveDisputeAdmin(d.projectId, "CLIENT", reason).then(() => {
                                  alert("Dispute resolved in Client Favor. You must now manually execute a refund for this project payment via the Financial Control Center.");
                                  window.location.reload();
                                });
                              });
                            }}>Client Favor</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
    </div>
  );
}
