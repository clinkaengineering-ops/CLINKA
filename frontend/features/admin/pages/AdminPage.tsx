"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useAdmin } from "../hooks/useAdmin";
import { AdminHeader } from "../components/AdminHeader";
import { AdminStatsGrid } from "../components/AdminStatsGrid";
import { AdminVerificationList } from "../components/AdminVerificationList";
import { BanManagementPanel } from "../components/BanManagementPanel";
import { AdminChatViewer } from "../components/AdminChatViewer";
import { AdminUserDirectory } from "../components/AdminUserDirectory";
import { AdminProjectsPanel } from "../components/AdminProjectsPanel";
import { AdminReviewsPanel } from "../components/AdminReviewsPanel";
import { AdminFinancialsPanel } from "../components/AdminFinancialsPanel";
import { AdminAnalytics } from "../components/AdminAnalytics";
import { AdminSystemLogs } from "../components/AdminSystemLogs";

type AdminTab = "overview" | "users" | "projects" | "reviews" | "financials" | "bans" | "chats" | "analytics" | "logs";

export function AdminPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<AdminTab>("overview");
  const {
    stats,
    verifications,
    loading,
    error,
    actionLoading,
    refetch,
    approve,
    reject,
  } = useAdmin();

  if (user?.role !== "ADMIN") {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <p className="text-slate-500">{t("ad.accessDenied")}</p>
        <Link href="/login" className="inline-block mt-4">
          <Button variant="secondary">{t("auth.signin")}</Button>
        </Link>
      </div>
    );
  }

  function handleExport() {
    const rows = [
      ["Name", "Email", "Specialty", "Document", "Submitted"],
      ...verifications.map((v) => [
        v.name,
        v.email,
        v.specialty,
        v.documentType,
        new Date(v.submittedAt).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pending-verifications.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <AdminHeader onExport={handleExport} exportDisabled={loading} />

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 flex justify-between items-center">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        {(
          [
            ["overview", "Overview"],
            ["users", "Directory"],
            ["projects", "Projects"],
            ["reviews", "Reviews"],
            ["financials", "Financials"],
            ["bans", "Bans"],
            ["chats", "Chats"],
            ["analytics", "Analytics"],
            ["logs", "System Logs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-t-lg transition",
              tab === id
                ? "text-electric-600 dark:text-electric-400 border-b-2 border-electric-500 -mb-px"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "users" && <AdminUserDirectory />}
      
      {tab === "projects" && <AdminProjectsPanel />}

      {tab === "reviews" && <AdminReviewsPanel />}

      {tab === "financials" && <AdminFinancialsPanel />}

      {tab === "bans" && <BanManagementPanel />}

      {tab === "chats" && <AdminChatViewer />}

      {tab === "analytics" && <AdminAnalytics />}

      {tab === "logs" && <AdminSystemLogs />}

      {tab === "overview" &&
        (loading ? (
          <Card className="p-12 text-center text-slate-500">{t("common.loading")}</Card>
        ) : stats ? (
          <>
            <AdminStatsGrid stats={stats} />
            <AdminVerificationList
              verifications={verifications}
              actionLoading={actionLoading}
              onApprove={approve}
              onReject={reject}
            />
          </>
        ) : null)}
    </div>
  );
}
