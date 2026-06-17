"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@/components/UI";
import { fetchAdminAnalytics, type AnalyticsData } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function SimpleSparkline({ data, type }: { data: number[]; type: "signups" | "gmv" }) {
  if (data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <svg viewBox="0 0 200 60" width="100%" height="60" className="block">
      <polyline
        fill="none"
        stroke={type === "signups" ? "#3b82f6" : "#10b981"}
        strokeWidth="2"
        points={data
          .map((val, i) => {
            const x = (i / (data.length - 1 || 1)) * 200;
            const y = 60 - ((val - min) / range) * 50 - 5;
            return `${x},${y}`;
          })
          .join(" ")}
      />
    </svg>
  );
}

export function AdminAnalytics() {
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

  const dailySignupCounts = analytics?.dailySignups.map((d) => d.count) ?? [];
  const dailyGmvAmounts = analytics?.dailyGmv.map((d) => d.amount) ?? [];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-slate-500 font-semibold uppercase">Daily Signups</p>
              <h3 className="text-2xl font-bold mt-1">
                {analytics?.dailySignups.length ? dailySignupCounts[dailySignupCounts.length - 1] : 0}
              </h3>
            </div>
            <span className="text-2xl">📈</span>
          </div>
          {dailySignupCounts.length > 0 && <SimpleSparkline data={dailySignupCounts} type="signups" />}
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-slate-500 font-semibold uppercase">Daily GMV</p>
              <h3 className="text-2xl font-bold mt-1">
                ${analytics?.dailyGmv.length ? analytics.dailyGmv[analytics.dailyGmv.length - 1].amount.toLocaleString() : 0}
              </h3>
            </div>
            <span className="text-2xl">💰</span>
          </div>
          {dailyGmvAmounts.length > 0 && <SimpleSparkline data={dailyGmvAmounts} type="gmv" />}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
          <div>
            <h2 className="font-bold">Detailed Trends</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Daily breakdown of signups and gross merchandise value.
            </p>
          </div>
          <Button size="sm" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && <p className="p-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">{error}</p>}

        {loading && !analytics ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading analytics...</p>
        ) : analytics && (analytics.dailySignups.length > 0 || analytics.dailyGmv.length > 0) ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">Date</th>
                  <th className="text-start p-3 font-semibold">New Signups</th>
                  <th className="text-start p-3 font-semibold">GMV</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailySignups.length > 0 &&
                  analytics.dailySignups.slice(-30).reverse().map((signup, idx) => {
                    const gmvEntry = analytics.dailyGmv.find((g) => g.date === signup.date);
                    return (
                      <tr key={signup.date} className="border-b border-slate-100 dark:border-slate-800/80">
                        <td className="p-3">
                          <p className="font-medium">{new Date(signup.date + "T00:00:00").toLocaleDateString()}</p>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{signup.count}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ${gmvEntry?.amount.toLocaleString() ?? 0}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-slate-500 text-sm">No analytics data available yet.</p>
        )}
      </Card>
    </div>
  );
}
