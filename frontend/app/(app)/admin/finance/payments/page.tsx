"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@/components/UI";
import { fetchAdminManualPayments } from "@/features/admin/api/admin.finance.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { PaymentDetailsDrawer } from "./PaymentDetailsDrawer";

export default function ManualPaymentsPage() {
  const [data, setData] = useState<{ items: any[], total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await fetchAdminManualPayments(1, 50, status, undefined, search));
    } catch (err: any) {
      setError(err.message || "Failed to load manual payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(load, 300);
    return () => clearTimeout(delay);
  }, [status, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Manual Payments Management</h2>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search ref, client..." 
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <Button onClick={load} variant="secondary" size="sm" disabled={loading}>Refresh</Button>
        </div>
      </div>

      {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl">{error}</div>}

      <Card className="p-0 overflow-hidden">
        {loading && !data ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : data?.items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No manual payment submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase bg-slate-50 dark:bg-slate-900">
                  <th className="p-3 font-semibold">Payment / Project</th>
                  <th className="p-3 font-semibold">Client ↔ Engineer</th>
                  <th className="p-3 font-semibold">Method & Ref</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((sub: any) => (
                  <tr 
                    key={sub.id} 
                    onClick={() => setSelectedSubmissionId(sub.id)}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition cursor-pointer"
                  >
                    <td className="p-3">
                      <p className="font-semibold text-electric-600 dark:text-electric-400">PAY-{sub.paymentId}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{sub.payment.project.title}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium">{sub.payment.client.name}</p>
                      <p className="text-xs text-slate-500">to {sub.payment.engineer.user.name}</p>
                    </td>
                    <td className="p-3">
                      <Badge color="slate">{sub.paymentMethod.replace(/_/g, " ")}</Badge>
                      <p className="font-mono text-xs mt-1">{sub.transactionReference}</p>
                    </td>
                    <td className="p-3 font-semibold">
                      {formatMoney(Number(sub.amount), sub.currency)}
                    </td>
                    <td className="p-3">
                      <Badge color={sub.status === "VERIFIED" ? "green" : sub.status === "REJECTED" ? "rose" : "amber"}>
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedSubmissionId && (
        <PaymentDetailsDrawer 
          submissionId={selectedSubmissionId} 
          onClose={() => setSelectedSubmissionId(null)} 
          onUpdated={load}
        />
      )}
    </div>
  );
}
