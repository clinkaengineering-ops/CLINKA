"use client";

import { Card, Badge } from "@/components/UI";
import { AreaChart, BarChart, Donut, ChartMeta, seriesStats } from "@/components/Charts";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useI18n } from "@/i18n";
import { useSpendOverview } from "../hooks/useClientDashboard";
import type { SpendOverview } from "@/types";

const CHART_COLOR = "#196481";

function translateProjectStatus(label: string, t: (key: string) => string) {
  switch (label) {
    case "Open":
      return t("cd.status.open");
    case "In progress":
      return t("cd.status.inProgress");
    case "Completed":
      return t("cd.status.completed");
    case "Other":
      return t("cd.status.other");
    case "No projects":
      return t("cd.noProjectsShort");
    default:
      return label;
  }
}

function localizeMonthLabel(label: string, lang: string) {
  const parsed = Date.parse(`${label} 1, 2000`);
  if (Number.isNaN(parsed)) return label;
  return new Date(parsed).toLocaleDateString(lang === "ar" ? "ar-EG" : "en", {
    month: "short",
  });
}

function SpendCharts({ data }: { data: SpendOverview }) {
  const { t, lang } = useI18n();
  const spendStats = seriesStats(data.monthlyAmounts);
  const periodTotal = data.monthlyAmounts.reduce((s, n) => s + n, 0);
  const escrowCapacity = data.inEscrow + data.released;
  const monthlyLabels = data.monthlyLabels.map((label) => localizeMonthLabel(label, lang));

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold">{t("cd.spendAnalytics")}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("cd.spendDesc6m")}</p>
          </div>
          <Badge color="slate">
            {data.total} {t("cd.allTime")}
          </Badge>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">
            {formatMoney(periodTotal)}{" "}
            <span className="text-base font-medium text-slate-500">{t("cd.last6Months")}</span>
          </p>
        </div>
        <div className="mt-4 text-electric-500">
          <AreaChart
            data={data.monthlyAmounts}
            labels={monthlyLabels}
            color={CHART_COLOR}
            height={200}
            formatValue={(n) => formatMoney(n)}
            yAxisLabel="USD"
          />
          <ChartMeta
            items={[
              { label: t("cd.sixMonthTotal"), value: formatMoney(periodTotal) },
              { label: t("cd.bestMonth"), value: formatMoney(spendStats.max) },
              { label: t("cd.monthlyAvg"), value: formatMoney(spendStats.avg) },
              {
                label: t("cd.peakMonth"),
                value: monthlyLabels[spendStats.maxIndex] ?? "—",
              },
            ]}
            breakdown={monthlyLabels.map((label, i) => ({
              label,
              value: formatMoney(data.monthlyAmounts[i]),
            }))}
            note={t("cd.spendNote")}
          />
        </div>
      </Card>

      <Card className="p-5">
        <div>
          <h2 className="font-bold">{t("cd.escrowOverview")}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t("cd.fundsHeld")}</p>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <Donut
            value={data.utilizationPercent}
            color={CHART_COLOR}
            size={130}
            label={t("cd.utilised")}
            subLabel={formatMoney(data.inEscrow)}
          />
        </div>
        <ChartMeta
          items={[
            { label: t("cd.inEscrowS"), value: formatMoney(data.inEscrow) },
            { label: t("cd.released"), value: formatMoney(data.released) },
            { label: t("cd.refunded"), value: formatMoney(data.refunded) },
            { label: t("cd.pendingFund"), value: formatMoney(data.pending) },
          ]}
          note={
            escrowCapacity > 0
              ? t("cd.escrowUtilNote").replace("{percent}", String(data.utilizationPercent))
              : t("cd.escrowEmptyNote")
          }
        />
      </Card>
    </div>
  );
}

function ProjectStatusChart({ data }: { data: SpendOverview }) {
  const { t } = useI18n();
  const statusLabels = data.projectStatusLabels.map((label) =>
    translateProjectStatus(label, t),
  );

  return (
    <Card className="p-5">
      <div>
        <h2 className="font-bold">{t("cd.projectsByStatus")}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{t("cd.projectsBreakdown")}</p>
      </div>
      <div className="mt-4 text-electric-500">
        <BarChart
          data={data.projectStatusCounts}
          labels={statusLabels}
          color={CHART_COLOR}
          height={180}
          formatValue={(n) => String(Math.round(n))}
        />
        <ChartMeta
          items={statusLabels.map((label, i) => ({
            label,
            value: String(data.projectStatusCounts[i]),
          }))}
          note={t("cd.projectsStatusNote")}
        />
      </div>
    </Card>
  );
}

export function ClientDashboardAnalytics() {
  const { data, loading, error } = useSpendOverview("6M");

  if (loading && !data) {
    return <div className="animate-pulse h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl" />;
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <SpendCharts data={data} />
      <ProjectStatusChart data={data} />
    </div>
  );
}
