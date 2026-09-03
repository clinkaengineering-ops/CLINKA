"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge, StatCard } from "@/components/UI";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { fetchAdminPayments, fetchPlatformSettings, updatePlatformSettings, overrideAdminPayment, type AdminPayment } from "../api/admin.api";

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

  const load = async () => {
    setLoading(true);
    try {
      const [settingsRes, paymentsRes] = await Promise.all([
        fetchPlatformSettings(),
        fetchAdminPayments(1, 50),
      ]);
      setFeePercent(settingsRes.platformFeePercent);
      setPayments(paymentsRes.payments);
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
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(Number(p.amount))}</p>
                      <p className="text-xs text-slate-500">Fee: {formatMoney(Number(p.commission))}</p>
                    </td>
                    <td className="p-3">
                      <Badge color={p.status === "RELEASED" ? "green" : p.status === "REFUNDED" ? "slate" : "amber"}>
                        {p.status}
                      </Badge>
                      {p.isAdminOverride && (
                        <Badge color="amber" className="ml-2">
                          Override
                        </Badge>
                      )}
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
    </div>
  );
}
