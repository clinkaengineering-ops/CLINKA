"use client";

import { Badge, Button, Card } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { EscrowContractRow } from "../types";
import { formatMoney } from "../utils/formatMoney";

export function EscrowTransactionTable({
  contracts,
}: {
  contracts: EscrowContractRow[];
}) {
  const { t } = useI18n();

  const rows = contracts.map((c) => ({
    key: `prj-${c.projectId}${c.paymentId != null ? `-pay-${c.paymentId}` : "-pending"}`,
    date: new Date(c.updatedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    desc: `${c.projectTitle}`,
    ref: c.paymentId ? `PAY-${c.paymentId}` : `PRJ-${c.projectId}`,
    type:
      c.status === "Released"
        ? "Release"
        : c.status === "In escrow"
          ? "Escrow Hold"
          : c.status === "Refunded"
            ? "Refund"
            : "Pending",
    color:
      c.status === "Released"
        ? "green"
        : c.status === "In escrow"
          ? "electric"
          : c.status === "Refunded"
            ? "amber"
            : "slate",
    amount: formatMoney(c.amount),
    status: c.status,
  }));

  return (
    <Card className="lg:col-span-2">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold">{t("es.txHistory")}</h2>
        <Button
          size="sm"
          variant="ghost"
          icon={<IconArrow width={14} height={14} />}
          onClick={() => {
            const header = ["Date", "Project", "Type", "Amount", "Status"];
            const lines = contracts.map((c) =>
              [
                new Date(c.updatedAt).toISOString(),
                c.projectTitle,
                c.status,
                c.amount,
                c.status,
              ].join(","),
            );
            const csv = [header.join(","), ...lines].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "escrow-transactions.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          disabled={contracts.length === 0}
        >
          {t("common.exportCsv")}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
            <tr>
              <th className="text-start p-4">{t("es.cols.date")}</th>
              <th className="text-start p-4">{t("es.cols.desc")}</th>
              <th className="text-start p-4">{t("es.cols.type")}</th>
              <th className="text-end p-4">{t("es.cols.amount")}</th>
              <th className="text-start p-4">{t("es.cols.status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  {t("es.noContracts")}
                </td>
              </tr>
            ) : (
              rows.map((tt) => (
                <tr
                  key={tt.key}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                >
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {tt.date}
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{tt.desc}</p>
                    <p className="text-xs text-slate-500">{tt.ref}</p>
                  </td>
                  <td className="p-4">
                    <Badge color={tt.color as "green" | "electric" | "amber" | "slate"}>
                      {tt.type}
                    </Badge>
                  </td>
                  <td className="p-4 text-end font-bold text-slate-700 dark:text-slate-200">
                    {tt.amount}
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-slate-500">{tt.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
