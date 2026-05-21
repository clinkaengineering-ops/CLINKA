"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useEscrow } from "../hooks/useEscrow";
import type { EscrowContractRow } from "../types";
import { EscrowStatusBanner } from "../components/EscrowStatusBanner";
import { EscrowStats } from "../components/EscrowStats";
import { EscrowContractsList } from "../components/EscrowContractsList";
import { EscrowTransactionTable } from "../components/EscrowTransactionTable";
import { useEngineerEscrow } from "../hooks/useEngineerEscrow";
import { formatMoney } from "../utils/formatMoney";
import { checkoutPath } from "../utils/goToCheckout";

export function EscrowPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    contracts,
    stats,
    loading,
    error,
    actionLoading,
    banner,
    dismissBanner,
    refetch,
    releasePayment,
    refundPayment,
  } = useEscrow();
  const searchParams = useSearchParams();

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";
  const engineerEscrow = useEngineerEscrow();

  function handleFund(row: EscrowContractRow) {
    router.push(checkoutPath(row.projectId));
  }

  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (!projectParam || !isClient) return;
    const pid = Number(projectParam);
    if (Number.isNaN(pid)) return;

    const row = contracts.find((c) => c.projectId === pid);
    if (row?.status === "Pending") {
      router.replace(checkoutPath(pid));
      return;
    }
    setSelectedProjectId(pid);
  }, [searchParams, isClient, contracts, router]);

  const [releaseError, setReleaseError] = useState<string | null>(null);

  async function handleRelease(paymentId: number) {
    setReleaseError(null);
    try {
      await releasePayment(paymentId);
    } catch (err) {
      setReleaseError((err as Error).message ?? "Failed to release payment");
    }
  }

  if (isEngineer) {
    const { payments, stats: eStats, loading: eLoading, error: eError } =
      engineerEscrow;
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("es.title")}</h1>
          <p className="mt-1 text-slate-500">{t("es.engineerSubtitle")}</p>
        </div>
        {eError && (
          <Card className="p-4 text-sm text-rose-500">{eError}</Card>
        )}
        {eLoading ? (
          <Card className="p-12 text-center text-slate-500">
            {t("common.loading")}
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <p>{t("es.engineerEmpty")}</p>
            <Link href="/projects" className="inline-block mt-4">
              <Button variant="secondary">{t("side.findProjects")}</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <Card className="p-4">
                <p className="text-slate-500">{t("es.s.inEscrow")}</p>
                <p className="text-xl font-bold mt-1">
                  {formatMoney(eStats.inEscrow)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-slate-500">{t("es.s.released")}</p>
                <p className="text-xl font-bold mt-1">
                  {formatMoney(eStats.released)}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-slate-500">{t("es.s.pending")}</p>
                <p className="text-xl font-bold mt-1">
                  {formatMoney(eStats.pending)}
                </p>
              </Card>
            </div>
            <Card className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{p.projectTitle}</p>
                    <p className="text-sm text-slate-500">
                      {formatMoney(p.amount)} · {p.status}
                    </p>
                  </div>
                  <Link href={`/projects?id=${p.projectId}`}>
                    <Button size="sm" variant="secondary">
                      {t("es.openProject")}
                    </Button>
                  </Link>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("es.title")}</h1>
        <Card className="p-8 text-center text-slate-500">
          {t("es.clientOnly")}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("es.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {t("es.subtitle")}
        </p>
      </div>

      {banner && (
        <EscrowStatusBanner
          type={banner.type}
          message={banner.message}
          onDismiss={dismissBanner}
        />
      )}

      {releaseError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex justify-between items-center gap-3">
          <span>{releaseError}</span>
          <Button size="sm" variant="ghost" onClick={() => setReleaseError(null)}>
            {t("common.close")}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex justify-between items-center gap-3">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          {t("common.loading")}
        </Card>
      ) : (
        <>
          <EscrowStats
            inEscrow={stats.inEscrow}
            released={stats.released}
            pending={stats.pending}
            refundCount={stats.refunded}
          />

          <EscrowContractsList
            contracts={contracts}
            selectedProjectId={
              selectedProjectId ?? contracts[0]?.projectId ?? null
            }
            onSelect={setSelectedProjectId}
            onFund={handleFund}
            onRelease={handleRelease}
            onRefund={async (paymentId) => {
              if (window.confirm(t("es.confirmRefund"))) {
                await refundPayment(paymentId);
              }
            }}
            actionLoading={actionLoading}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EscrowTransactionTable contracts={contracts} />
            </div>

            <Card className="p-5 bg-gradient-to-br from-navy-900 to-electric-700 text-white h-fit">
              <p className="text-sm font-bold">{t("es.helpTitle")}</p>
              <p className="mt-1 text-xs text-white/70">{t("es.helpDesc")}</p>
              <p className="mt-3 text-xs text-white/60">
                {t("es.fawaterkNote") ??
                  "Pay with card, Fawry, or Meeza on the secure Fawaterak page."}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-4 !bg-white !text-navy-900"
                icon={<IconArrow width={12} height={12} />}
                onClick={() =>
                  window.open("mailto:support@clinka.com", "_blank")
                }
              >
                {t("es.contact")}
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
