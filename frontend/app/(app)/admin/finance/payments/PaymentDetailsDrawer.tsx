"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input } from "@/components/UI";
import { fetchAdminManualPaymentDetails, verifyAdminManualPayment, rejectAdminManualPayment } from "@/features/admin/api/admin.finance.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

// Country flag helper
import { resolveBackendOrigin } from "@/lib/apiBaseUrl";

function countryFlag(code: string) {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + code.toUpperCase().charCodeAt(0) - 65,
    base + code.toUpperCase().charCodeAt(1) - 65,
  );
}

const METHOD_ICONS: Record<string, string> = {
  bank_transfer: "🏦",
  instapay: "📱",
  ewallet: "💳",
};

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  instapay: "InstaPay",
  ewallet: "E-Wallet",
};

function resolveProofUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^data:/i.test(path)) return path;
  
  // Relative server path — prepend API origin
  let base = resolveBackendOrigin();
  
  // In production, if base is empty (e.g. NEXT_PUBLIC_API_URL="/api"), 
  // we must force the absolute API domain because Next.js rewrites are disabled.
  if (!base && process.env.NODE_ENV === "production") {
    base = "https://api.clinkaeng.com";
  }
  
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function isImageMime(mime: string | null | undefined) {
  return mime?.startsWith("image/") ?? false;
}

export function PaymentDetailsDrawer({ submissionId, onClose, onUpdated }: { submissionId: number, onClose: () => void, onUpdated: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showReject, setShowReject] = useState(false);

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

  useEffect(() => {
    load();
  }, [submissionId]);

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
    if (!note.trim()) return alert("Please provide a reason for rejection.");
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

  const proofUrl = data ? resolveProofUrl(data.proofUrl || data.receiptUrl) : null;
  const isImage = isImageMime(data?.proofMimeType) || (proofUrl && /\.(jpg|jpeg|png|webp|gif)$/i.test(proofUrl));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {loading || !data ? (
          <div className="p-8 text-center text-slate-500">
            <div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading details...
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/80">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment Details</h2>
                  <p className="text-sm text-slate-500 mt-1">Submission #{data.id}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition" aria-label="Close">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Badge color={data.status === "VERIFIED" ? "green" : data.status === "REJECTED" ? "rose" : "amber"}>
                  {data.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  {new Date(data.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* ─── Section 1: Payment Information ─────────────────── */}
              <section>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-electric-500" />
                  Payment Information
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Project</p>
                      <p className="font-semibold">{data.payment.project.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Order ID</p>
                      <p className="font-mono font-semibold text-electric-600 dark:text-electric-400">#{data.payment.project.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Client</p>
                      <p className="font-semibold">{data.payment.client.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Engineer</p>
                      <p className="font-semibold">{data.payment.engineer.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="text-lg font-bold text-electric-600 dark:text-electric-400">{formatMoney(Number(data.amount), data.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Payment Status</p>
                      <Badge color={data.status === "VERIFIED" ? "green" : data.status === "REJECTED" ? "rose" : "amber"}>
                        {data.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </section>

              {/* ─── Section 2: Payment Method ──────────────────────── */}
              <section>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-electric-500" />
                  Payment Method
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{METHOD_ICONS[data.paymentMethod] || "💰"}</span>
                    <p className="font-bold text-lg">
                      {METHOD_LABELS[data.paymentMethod] || data.paymentMethod.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </section>

              {/* ─── Section 3: Receiving Destination Used ──────────── */}
              {(data.receivingMethod || data.receivingBankName || data.receivingInstapayAccount || data.receivingWalletProvider) && (
                <section>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-amber-500" />
                    Receiving Destination Used
                  </h3>
                  <div className="bg-amber-50/50 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 space-y-2.5 text-sm">
                    {/* Bank Transfer snapshot */}
                    {data.receivingMethod === "bank_transfer" && (
                      <>
                        {data.receivingCountry && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Country</span>
                            <span className="font-medium">{countryFlag(data.receivingCountry)} {data.receivingCountry}</span>
                          </div>
                        )}
                        {data.receivingBankName && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank</span>
                            <span className="font-medium">{data.receivingBankName}</span>
                          </div>
                        )}
                        {data.receivingAccountName && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Holder</span>
                            <span className="font-medium">{data.receivingAccountName}</span>
                          </div>
                        )}
                        {data.receivingIban && (
                          <div className="flex justify-between items-start">
                            <span className="text-slate-500">IBAN</span>
                            <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 select-all break-all text-right max-w-[280px]">{data.receivingIban}</span>
                          </div>
                        )}
                        {data.receivingAccountNumber && !data.receivingIban && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account No.</span>
                            <span className="font-mono text-xs">{data.receivingAccountNumber}</span>
                          </div>
                        )}
                        {data.receivingSwift && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">SWIFT/BIC</span>
                            <span className="font-mono text-xs">{data.receivingSwift}</span>
                          </div>
                        )}
                        {data.receivingCurrency && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Currency</span>
                            <span className="font-medium">{data.receivingCurrency}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* InstaPay snapshot */}
                    {data.receivingMethod === "instapay" && (
                      <>
                        {data.receivingInstapayAccount && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">InstaPay Account</span>
                            <span className="font-mono font-semibold">{data.receivingInstapayAccount}</span>
                          </div>
                        )}
                        {data.receivingAccountName && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Holder</span>
                            <span className="font-medium">{data.receivingAccountName}</span>
                          </div>
                        )}
                      </>
                    )}

                    {/* E-Wallet snapshot */}
                    {data.receivingMethod === "ewallet" && (
                      <>
                        {data.receivingWalletProvider && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Provider</span>
                            <span className="font-medium">{data.receivingWalletProvider}</span>
                          </div>
                        )}
                        {data.receivingWalletNumber && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Wallet Number</span>
                            <span className="font-mono font-semibold">{data.receivingWalletNumber}</span>
                          </div>
                        )}
                        {data.receivingAccountName && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Holder</span>
                            <span className="font-medium">{data.receivingAccountName}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-2 mt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                      <p className="text-[10px] uppercase tracking-wider text-amber-600/60 dark:text-amber-400/60">
                        Historical snapshot — captured at submission time
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* ─── Section 4: Client-Submitted Transaction Data ──── */}
              <section>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-electric-500" />
                  Transaction Data
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transaction Reference</p>
                    <p className="font-mono bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 select-all">
                      {data.transactionReference}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Amount</p>
                      <p className="font-bold">{formatMoney(Number(data.amount), data.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Currency</p>
                      <p className="font-semibold">{data.currency}</p>
                    </div>
                  </div>
                  {data.note && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client Note</p>
                      <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">
                        {data.note}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ─── Section 5: Transaction Proof ───────────────────── */}
              {proofUrl && (
                <section>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    Transaction Proof
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                    {isImage ? (
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img
                          src={proofUrl}
                          alt="Payment proof"
                          className="w-full max-h-[400px] object-contain bg-white dark:bg-slate-900"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-3xl">📄</span>
                        <div className="flex-1">
                          <p className="font-medium">{data.proofOriginalName || "Payment receipt"}</p>
                          {data.proofFileSize && (
                            <p className="text-xs text-slate-500">{(data.proofFileSize / 1024).toFixed(1)} KB</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-electric-600 dark:text-electric-400 bg-electric-50 dark:bg-electric-950/20 rounded-lg hover:bg-electric-100 dark:hover:bg-electric-950/30 transition"
                      >
                        {isImage ? "Open Full Size" : "View PDF"}
                      </a>
                      <a
                        href={proofUrl}
                        download={data.proofOriginalName || "proof"}
                        className="inline-flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* ─── Admin Note (if exists) ─────────────────────────── */}
              {data.adminNote && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <p className="font-semibold text-amber-800 dark:text-amber-400 mb-1 text-sm">
                    Admin Note / Reason
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-300">{data.adminNote}</p>
                </div>
              )}

              {/* Verified info */}
              {data.verifiedAt && (
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {data.status === "VERIFIED" ? "Verified" : "Processed"} on {new Date(data.verifiedAt).toLocaleString()}
                  {data.verifiedBy && ` · Admin ID: ${data.verifiedBy}`}
                </div>
              )}
            </div>

            {/* ─── Admin Actions ──────────────────────────────────── */}
            {data.status === "PENDING" && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                {!showReject ? (
                  <>
                    <div>
                      <label className="text-sm font-semibold mb-1 block">Admin Note (optional for verification)</label>
                      <Input 
                        value={note} 
                        onChange={e => setNote(e.target.value)} 
                        placeholder="e.g. Transaction verified in bank statement"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent" 
                        onClick={handleVerify}
                        disabled={processing}
                      >
                        ✓ Verify Payment
                      </Button>
                      <Button 
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-transparent" 
                        onClick={() => setShowReject(true)}
                        disabled={processing}
                      >
                        ✕ Reject Payment
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-semibold mb-1 block text-rose-600 dark:text-rose-400">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Explain why this payment is being rejected..."
                        className="w-full h-24 p-3 rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => setShowReject(false)}
                        disabled={processing}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-transparent" 
                        onClick={handleReject}
                        disabled={processing || !note.trim()}
                      >
                        Reject Payment
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
