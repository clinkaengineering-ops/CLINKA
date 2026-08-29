"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/UI";
import { fetchAdminManualPaymentDetails, verifyAdminManualPayment, rejectAdminManualPayment } from "@/features/admin/api/admin.finance.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

export function PaymentDetailsDrawer({ submissionId, onClose, onUpdated }: { submissionId: number, onClose: () => void, onUpdated: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    load();
  }, [submissionId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminManualPaymentDetails(submissionId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!confirm("Are you sure you want to verify this payment? This will fund the project escrow.")) return;
    setProcessing(true);
    try {
      await verifyAdminManualPayment(submissionId, note);
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || "Verification failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!note) return alert("Please provide a reason for rejection in the note field.");
    if (!confirm("Are you sure you want to reject this payment?")) return;
    setProcessing(true);
    try {
      await rejectAdminManualPayment(submissionId, note);
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || "Rejection failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!submissionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right"
        onClick={e => e.stopPropagation()}
      >
        {loading || !data ? (
          <div className="p-8 text-center text-slate-500">Loading details...</div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold">Payment Details</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="flex justify-between items-center">
                <Badge color={data.status === "VERIFIED" ? "green" : data.status === "REJECTED" ? "rose" : "amber"}>{data.status}</Badge>
                <span className="text-sm text-slate-500">{new Date(data.createdAt).toLocaleString()}</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Method</p>
                  <p className="font-semibold">
                    {data.paymentMethod === "instapay" ? "InstaPay" 
                      : data.paymentMethod === "ewallet" ? "E-Wallet" 
                      : data.paymentMethod === "bank_transfer" ? "Bank Transfer"
                      : data.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Transaction Ref</p>
                  <p className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border inline-block">{data.transactionReference}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-xl font-bold text-electric-600 dark:text-electric-400">{formatMoney(Number(data.amount), data.currency)}</p>
                </div>
                {data.receiptUrl && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Receipt</p>
                    <a href={data.receiptUrl} target="_blank" rel="noreferrer" className="text-electric-500 hover:underline">View Receipt Attachment</a>
                  </div>
                )}
                {data.note && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client Note</p>
                    <p className="text-sm bg-white dark:bg-slate-900 p-2 rounded">{data.note}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold mb-3 border-b pb-2">Project & Actors</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Project</p>
                    <p className="font-semibold">{data.payment.project.title}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Client</p>
                    <p className="font-semibold">{data.payment.client.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Engineer</p>
                    <p className="font-semibold">{data.payment.engineer.user.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Payment Escrow ID</p>
                    <p className="font-mono">PAY-{data.paymentId}</p>
                  </div>
                </div>
              </div>

              {data.adminNote && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Admin Note / Reason</p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">{data.adminNote}</p>
                </div>
              )}
            </div>

            {data.status === "PENDING" && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Admin Note (Required for rejection)</label>
                  <Input 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="e.g. Transaction verified in bank statement"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border-transparent" 
                    onClick={handleVerify}
                    disabled={processing}
                  >
                    Verify & Fund Escrow
                  </Button>
                  <Button 
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-transparent" 
                    onClick={handleReject}
                    disabled={processing}
                  >
                    Reject Submission
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
