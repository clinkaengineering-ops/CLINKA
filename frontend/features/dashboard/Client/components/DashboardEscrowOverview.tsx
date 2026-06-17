"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge, StatCard } from "@/components/UI";
import { IconWallet, IconCheck, IconClock } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { fetchEscrowPayments } from "@/features/escrow/api/payments.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import type { EscrowPaymentItem } from "@/features/escrow/types";

export function DashboardEscrowOverview() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<EscrowPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEscrowPayments()
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>;
  }

  const inEscrow = payments.filter((p) => p.status === "In escrow").reduce((sum, p) => sum + p.amount, 0);
  const released = payments.filter((p) => p.status === "Released").reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter((p) => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0);

  const recentPayments = payments.slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <h2 className="font-bold">{t("cd.escrowOverview")}</h2>
        <Link href="/escrow">
          <Badge color="blue" className="hover:bg-blue-100 transition cursor-pointer">
            {t("side.escrow")} →
          </Badge>
        </Link>
      </div>

      <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <IconShield width={12} height={12} className="text-blue-500" />
            {t("cd.inEscrowS")}
          </p>
          <p className="text-xl font-bold">{formatMoney(inEscrow)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <IconCheck width={12} height={12} className="text-green-500" />
            {t("cd.released")}
          </p>
          <p className="text-xl font-bold">{formatMoney(released)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <IconClock width={12} height={12} className="text-slate-500" />
            {t("cd.pending")}
          </p>
          <p className="text-xl font-bold">{formatMoney(pending)}</p>
        </div>
      </div>

      {recentPayments.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentPayments.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
              <div>
                <p className="text-sm font-semibold">{p.projectTitle}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{formatMoney(p.amount)}</p>
                <div className="mt-1">
                  <EscrowBadge status={p.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-slate-500">
          {t("es.noContracts")}
        </div>
      )}
    </Card>
  );
}

function IconShield(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function EscrowBadge({ status }: { status: string }) {
  const { t } = useI18n();
  switch (status) {
    case "Released":
      return <Badge color="green">{t("cd.released")}</Badge>;
    case "In escrow":
      return <Badge color="blue">{t("cd.inEscrowS")}</Badge>;
    case "Pending":
      return <Badge color="slate">{t("cd.pending")}</Badge>;
    case "Refunded":
      return <Badge color="rose">{t("es.s.refunded")}</Badge>;
    default:
      return <Badge color="slate">{status}</Badge>;
  }
}
