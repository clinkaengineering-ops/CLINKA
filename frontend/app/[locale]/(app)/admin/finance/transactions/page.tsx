"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@/components/UI";
import { fetchUnifiedTransactions, type UnifiedTransaction } from "@/features/admin/api/admin.finance.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

export default function FinanceTransactionsPage() {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTransactions(await fetchUnifiedTransactions());
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading transactions...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Unified Transactions Ledger</h2>
        <Button onClick={load} variant="secondary" size="sm">Refresh</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase bg-slate-50 dark:bg-slate-900">
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">ID / Ref</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                    <td className="p-3 whitespace-nowrap text-slate-500 text-xs">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <p className="font-mono text-xs">{tx.id}</p>
                      {tx.reference && <p className="font-mono text-xs text-slate-500">{tx.reference}</p>}
                    </td>
                    <td className="p-3">
                      <Badge color="slate">{tx.type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="p-3 font-semibold">{tx.user}</td>
                    <td className="p-3 font-semibold">
                      {formatMoney(Number(tx.amount))}
                    </td>
                    <td className="p-3">
                      <Badge color={tx.status === "COMPLETED" || tx.status === "AVAILABLE" ? "green" : tx.status.includes("FAILED") || tx.status === "REJECTED" ? "rose" : "amber"}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500 max-w-xs truncate" title={tx.note}>
                      {tx.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
