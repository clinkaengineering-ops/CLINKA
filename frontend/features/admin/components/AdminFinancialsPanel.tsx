"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge, StatCard } from "@/components/UI";
import { fetchAdminPayments, fetchPlatformSettings, updatePlatformSettings, overrideAdminPayment, fetchAdminWithdrawalRequests, updateWithdrawalRequestStatus, type AdminPayment, type AdminWithdrawalRequest } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function AdminFinancialsPanel() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [feePercent, setFeePercent] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [savingFee, setSavingFee] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalRequest[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [settingsRes, paymentsRes, withdrawalsRes] = await Promise.all([
        fetchPlatformSettings(),
        fetchAdminPayments(1, 50),
        fetchAdminWithdrawalRequests(1, 50)
      ]);
      setFeePercent(settingsRes.platformFeePercent);
      setPayments(paymentsRes.payments);
      setWithdrawals(withdrawalsRes.items);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveFee = async () => {
    if (feePercent === "") return;
    setSavingFee(true);
    try {
      await updatePlatformSettings({ platformFeePercent: Number(feePercent) });
      alert("Platform fee updated successfully.");
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setSavingFee(false);
    }
  };

  const handleOverride = async (id: number, status: "RELEASED" | "REFUNDED") => {
    if (!confirm(`Are you sure you want to force status to ${status}?`)) return;
    try {
      await overrideAdminPayment(id, status);
      load();
    } catch (err) {
      alert(axiosMessage(err));
    }
  };

  const handleWithdrawalStatus = async (id: number, status: "PROCESSING" | "COMPLETED" | "REJECTED") => {
    const notes = status === "REJECTED" ? prompt("Reason for rejection?") : undefined;
    if (status === "REJECTED" && !notes) return;
    try {
      await updateWithdrawalRequestStatus(id, { status, adminNotes: notes || undefined });
      load();
    } catch (err) {
      alert(axiosMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border border-electric-500/30 bg-electric-50 dark:bg-electric-900/10">
        <h2 className="font-bold mb-1">Platform Fee Settings</h2>
        <p className="text-sm text-slate-500 mb-4">
          This commission percentage is automatically deducted from project payments.
        </p>
        <div className="flex items-end gap-3 max-w-sm">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Fee Percentage (%)</label>
            <input 
              type="number" 
              value={feePercent} 
              onChange={(e) => setFeePercent(e.target.value ? Number(e.target.value) : "")}
              min={0}
              max={100}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <Button onClick={handleSaveFee} disabled={savingFee || feePercent === ""}>
            {savingFee ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
          <div>
            <h2 className="font-bold">Payment & Escrow Oversight</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Monitor payments and override stuck escrows to resolve disputes.
            </p>
          </div>
          <Button size="sm" onClick={load} disabled={loading} variant="secondary">
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error && <p className="p-4 text-sm text-rose-500">{error}</p>}

        {loading && payments.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading financials...</p>
        ) : payments.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">No payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">Project</th>
                  <th className="text-start p-3 font-semibold">Client ↔ Engineer</th>
                  <th className="text-start p-3 font-semibold">Amount / Fee</th>
                  <th className="text-start p-3 font-semibold">Status</th>
                  <th className="text-start p-3 font-semibold">Overrides</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="p-3">
                      <p className="font-medium max-w-[150px] truncate" title={p.project.title}>{p.project.title}</p>
                      <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-semibold">{p.client.name} <span className="font-normal text-slate-500">(Client)</span></p>
                      <p className="text-xs font-semibold">{p.engineer.user.name} <span className="font-normal text-slate-500">(Engineer)</span></p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">${p.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">Fee: ${p.commission.toLocaleString()}</p>
                    </td>
                    <td className="p-3">
                      <Badge color={p.status === "RELEASED" ? "green" : p.status === "REFUNDED" ? "slate" : "amber"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          disabled={p.status !== "FUNDED" && p.status !== "PENDING"}
                          onClick={() => handleOverride(p.id, "RELEASED")}
                        >
                          Force Release
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          disabled={p.status !== "FUNDED" && p.status !== "PENDING"}
                          onClick={() => handleOverride(p.id, "REFUNDED")}
                        >
                          Force Refund
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
          <div>
            <h2 className="font-bold">Withdrawal Requests</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Review and process engineer withdrawal requests.
            </p>
          </div>
        </div>

        {loading && withdrawals.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading requests...</p>
        ) : withdrawals.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">No withdrawal requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                  <th className="text-start p-3 font-semibold">Engineer</th>
                  <th className="text-start p-3 font-semibold">Amount</th>
                  <th className="text-start p-3 font-semibold">Method / Account</th>
                  <th className="text-start p-3 font-semibold">Status</th>
                  <th className="text-start p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="p-3">
                      <p className="font-semibold">{w.user.name}</p>
                      <p className="text-xs text-slate-500">{w.user.email}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {w.amount.toLocaleString()} EGP
                    </td>
                    <td className="p-3">
                      <Badge color="slate">{w.method}</Badge>
                      <p className="text-xs font-mono mt-1">{w.accountNumber}</p>
                    </td>
                    <td className="p-3">
                      <Badge color={w.status === "COMPLETED" ? "green" : w.status === "REJECTED" ? "rose" : w.status === "PROCESSING" ? "blue" : "amber"}>
                        {w.status}
                      </Badge>
                      {w.adminNotes && (
                        <p className="text-xs text-slate-500 mt-1 max-w-[150px] truncate" title={w.adminNotes}>
                          {w.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      {w.status === "PENDING" && (
                        <Button size="sm" onClick={() => handleWithdrawalStatus(w.id, "PROCESSING")}>
                          Mark Processing
                        </Button>
                      )}
                      {w.status === "PROCESSING" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleWithdrawalStatus(w.id, "COMPLETED")}>
                            Complete
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => handleWithdrawalStatus(w.id, "REJECTED")}>
                            Reject
                          </Button>
                        </div>
                      )}
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
