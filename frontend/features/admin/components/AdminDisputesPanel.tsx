"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Button, Badge, Field } from "@/components/UI";
import {
  fetchActiveDisputes,
  resolveDispute,
  manualFreeze,
  lookupAdminUser,
  type ActiveDispute,
} from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function AdminDisputesPanel() {
  const [disputes, setDisputes] = useState<ActiveDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [resolveModal, setResolveModal] = useState<{
    open: boolean;
    projectId: number;
    resolution: "ENGINEER" | "CLIENT" | null;
  }>({ open: false, projectId: 0, resolution: null });
  const [resolveReason, setResolveReason] = useState("");
  const [resolving, setResolving] = useState(false);

  const [freezeModal, setFreezeModal] = useState<{ open: boolean; engineerId: number }>({ open: false, engineerId: 0 });
  const [freezeAmount, setFreezeAmount] = useState("");
  const [freezeReason, setFreezeReason] = useState("");
  const [freezing, setFreezing] = useState(false);
  const [lookupResult, setLookupResult] = useState<{ name: string; email: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeModal.engineerId) return;
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      const user = await lookupAdminUser(freezeModal.engineerId.toString());
      if (user.role !== "ENGINEER") {
        setLookupError("The provided ID does not belong to an Engineer.");
      } else {
        setLookupResult({ name: user.name, email: user.email });
      }
    } catch (err) {
      setLookupError("Could not resolve this ID to an engineer profile.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActiveDisputes(50);
      setDisputes(data);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveReason.trim() || !resolveModal.resolution) return;
    setResolving(true);
    try {
      await resolveDispute(resolveModal.projectId, resolveModal.resolution, resolveReason);
      setResolveModal({ open: false, projectId: 0, resolution: null });
      setResolveReason("");
      load();
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setResolving(false);
    }
  };

  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeReason.trim() || !freezeAmount) return;
    setFreezing(true);
    try {
      await manualFreeze(freezeModal.engineerId, Number(freezeAmount), freezeReason);
      setFreezeModal({ open: false, engineerId: 0 });
      setFreezeReason("");
      setFreezeAmount("");
      setLookupResult(null);
      setLookupError(null);
      alert("Funds frozen successfully");
    } catch (err) {
      alert(axiosMessage(err));
    } finally {
      setFreezing(false);
    }
  };

  return (
    <div className="space-y-4" style={{ direction: (typeof document !== 'undefined' ? document.documentElement.dir : 'ltr') as "ltr" | "rtl" | undefined }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Disputes & Escalations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage active disputes and manual fund freezes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setFreezeModal({ open: true, engineerId: 0 })}>
            Manual Freeze
          </Button>
          <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 dark:bg-rose-900/10 p-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active disputes found.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-500">{d.caseId}</span>
                    <Badge color={d.statusColor === "red" ? "rose" : d.statusColor}>{d.status}</Badge>
                    <span className="text-xs text-slate-400">{d.ageHours}h ago</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {d.subject}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Opened by: {d.parties}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="!bg-emerald-50 dark:!bg-emerald-900/20 !text-emerald-700 dark:!text-emerald-400"
                    onClick={() => setResolveModal({ open: true, projectId: d.projectId, resolution: "CLIENT" })}
                  >
                    Favor Client (Refund)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="!bg-blue-50 dark:!bg-blue-900/20 !text-blue-700 dark:!text-blue-400"
                    onClick={() => setResolveModal({ open: true, projectId: d.projectId, resolution: "ENGINEER" })}
                  >
                    Favor Engineer (Pay)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                Resolve Dispute
              </h3>
              <button
                type="button"
                onClick={() => setResolveModal({ open: false, projectId: 0, resolution: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                You are resolving this dispute in favor of the <strong>{resolveModal.resolution}</strong>. Please provide a reason for the audit log.
              </p>
              <form id="resolve-form" onSubmit={handleResolve}>
                <Field label="Resolution Reason">
                  <textarea
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    rows={3}
                    value={resolveReason}
                    onChange={(e) => setResolveReason(e.target.value)}
                    required
                  />
                </Field>
              </form>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setResolveModal({ open: false, projectId: 0, resolution: null })}>
                Cancel
              </Button>
              <Button type="submit" form="resolve-form" className="!bg-electric-600 !text-white" disabled={resolving || !resolveReason.trim()}>
                {resolving ? "Resolving..." : "Confirm Resolution"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze Modal */}
      {freezeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                Manual Fund Freeze
              </h3>
              <button
                type="button"
                onClick={() => {
                  setFreezeModal({ open: false, engineerId: 0 });
                  setLookupResult(null);
                  setLookupError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Manually freeze funds for an engineer. This moves their available/pending balance to heldByDispute.
              </p>
              
              {!lookupResult ? (
                <form id="lookup-form" onSubmit={handleLookup} className="space-y-4">
                  <Field label="Engineer Profile ID">
                    <input
                      type="number"
                      placeholder="e.g. 42"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={freezeModal.engineerId || ""}
                      onChange={(e) => {
                        setFreezeModal({ ...freezeModal, engineerId: Number(e.target.value) });
                        setLookupError(null);
                      }}
                      required
                    />
                  </Field>
                  {lookupError && (
                    <div className="text-sm text-rose-600 bg-rose-50 p-2 rounded">
                      {lookupError}
                    </div>
                  )}
                </form>
              ) : (
                <form id="freeze-form" onSubmit={handleFreeze} className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 mb-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Target Engineer:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{lookupResult.name} ({lookupResult.email})</p>
                    <button 
                      type="button" 
                      className="text-xs text-blue-600 mt-2 underline"
                      onClick={() => setLookupResult(null)}
                    >
                      Change ID
                    </button>
                  </div>
                  
                  <Field label="Amount (USD)">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount to freeze"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      value={freezeAmount}
                      onChange={(e) => setFreezeAmount(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Reason">
                    <textarea
                      placeholder="Reason for freezing funds"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      rows={2}
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      required
                    />
                  </Field>
                </form>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setFreezeModal({ open: false, engineerId: 0 });
                  setLookupResult(null);
                  setLookupError(null);
                }}
              >
                Cancel
              </Button>
              {!lookupResult ? (
                <Button 
                  type="submit" 
                  form="lookup-form" 
                  className="!bg-electric-600 !text-white" 
                  disabled={isLookingUp || !freezeModal.engineerId}
                >
                  {isLookingUp ? "Looking up..." : "Verify Engineer"}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="freeze-form" 
                  className="!bg-rose-600 !text-white" 
                  disabled={freezing || !freezeAmount || !freezeReason.trim()}
                >
                  {freezing ? "Freezing..." : "Confirm & Freeze"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
