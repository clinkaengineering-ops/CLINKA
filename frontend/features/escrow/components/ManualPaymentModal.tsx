"use client";

import { useState, useRef } from "react";
import { Button, Field, Input } from "@/components/UI";
import { useI18n } from "@/i18n";
import { formatMoney } from "../utils/formatMoney";

type PaymentMethod = "bank_transfer" | "instapay" | "ewallet";

export function ManualPaymentModal({
  open,
  onClose,
  projectTitle,
  amount,
  loading,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  amount: number;
  loading: boolean;
  onConfirm: (formData: FormData) => Promise<void>;
}) {
  const { t } = useI18n();
  const [method, setMethod] = useState<PaymentMethod>("instapay");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Transaction reference is required.");
      return;
    }
    
    setError(null);
    try {
      const formData = new FormData();
      formData.append("paymentMethod", method);
      formData.append("transactionReference", reference);
      formData.append("amount", amount.toString());
      formData.append("currency", "USD");
      if (note) formData.append("note", note);
      if (file) formData.append("proof", file);

      await onConfirm(formData);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-lg font-bold">Manual Payment</h3>
              <p className="text-sm text-slate-500 mt-1">{projectTitle}</p>
              <p className="text-xl font-bold text-electric-600 dark:text-electric-400 mt-2">
                {formatMoney(amount)}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${method === "instapay" ? "border-electric-500 bg-electric-50 dark:bg-electric-950/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <input type="radio" name="method" value="instapay" checked={method === "instapay"} onChange={() => setMethod("instapay")} className="sr-only" />
                  <span className="text-sm font-medium">InstaPay</span>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${method === "ewallet" ? "border-electric-500 bg-electric-50 dark:bg-electric-950/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <input type="radio" name="method" value="ewallet" checked={method === "ewallet"} onChange={() => setMethod("ewallet")} className="sr-only" />
                  <span className="text-sm font-medium">E-Wallet</span>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${method === "bank_transfer" ? "border-electric-500 bg-electric-50 dark:bg-electric-950/30" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  <input type="radio" name="method" value="bank_transfer" checked={method === "bank_transfer"} onChange={() => setMethod("bank_transfer")} className="sr-only" />
                  <span className="text-sm font-medium">Bank Transfer</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                Transfer Instructions
              </p>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {method === "instapay" && <p>Transfer to InstaPay: <strong className="font-mono">clinka-admin</strong></p>}
                {method === "ewallet" && <p>Transfer to Vodafone Cash: <strong className="font-mono">01000000000</strong></p>}
                {method === "bank_transfer" && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Account Name: CLINKA LTD</li>
                    <li>Account No: <span className="font-mono">123456789</span></li>
                  </ul>
                )}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-3">
                Please transfer the exact amount above and enter the reference below.
              </p>
            </div>

            <Field label="Transaction Reference" error={error && !reference ? "Required" : undefined}>
              <Input
                placeholder="1234567890"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Transfer Proof (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-electric-50 file:text-electric-700 hover:file:bg-electric-100 dark:file:bg-electric-900 dark:file:text-electric-300 cursor-pointer"
              />
            </div>

            <Field label="Optional Note">
              <Input
                placeholder="Any additional info"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>

            {error && (
              <p className="text-sm text-rose-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Payment Proof"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
