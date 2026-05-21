"use client";

import Link from "next/link";
import { Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useAdmin } from "../hooks/useAdmin";
import { AdminHeader } from "../components/AdminHeader";
import { AdminStatsGrid } from "../components/AdminStatsGrid";
import { AdminVerificationList } from "../components/AdminVerificationList";

export function AdminPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
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

      {loading ? (
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
      ) : null}
    </div>
  );
}
