"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { fetchEscrowPayments } from "@/features/escrow/api/payments.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

export function BillingSettingsTab() {
  const { t } = useI18n();
  const { me } = useAccountSettings();
  const [payments, setPayments] = useState<
    { projectTitle: string; amount: number; status: string }[]
  >([]);

  useEffect(() => {
    if (me?.role !== "CLIENT") return;
    fetchEscrowPayments()
      .then((list) =>
        setPayments(
          list.map((p) => ({
            projectTitle: p.projectTitle,
            amount: p.amount,
            status: p.status,
          })),
        ),
      )
      .catch(() => setPayments([]));
  }, [me?.role]);

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-navy-900 to-electric-700 text-white">
        <Badge className="!bg-white/10 !text-white !border-white/20">{t("st.gPay")}</Badge>
        <h2 className="mt-3 text-xl font-bold">{t("side.findProjects")}</h2>
        <p className="text-white/70 text-sm mt-2">{t("es.subtitle")}</p>
        <Link href="/projects" className="inline-block mt-4">
          <Button variant="secondary" className="!bg-white !text-navy-900">
            {t("side.findProjects")}
          </Button>
        </Link>
      </Card>
      {me?.role === "CLIENT" && (
        <Card className="p-6">
          <h2 className="font-bold">{t("st.recentPayments")}</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500 mt-2">{t("st.noPayments")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {payments.slice(0, 5).map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span>{p.projectTitle}</span>
                  <span>
                    {formatMoney(p.amount)} · {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
