"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button, Field, Input } from "@/components/UI";
import { useI18n } from "@/i18n";
import { formatMoney } from "../utils/formatMoney";
import {
  fetchManualPaymentSettings,
  type ManualPaymentSettings,
  type ManualBankAccount,
  type ManualInstapayAccount,
  type ManualWalletAccount,
} from "../api/payments.api";

type PaymentMethod = "bank_transfer" | "instapay" | "ewallet";
type Step = "method" | "destination" | "submit";

// Country flag helper
function countryFlag(code: string) {
  if (!code || code.length !== 2) return "🏳️";
  const base = 0x1f1e6;
  return String.fromCodePoint(
    base + code.toUpperCase().charCodeAt(0) - 65,
    base + code.toUpperCase().charCodeAt(1) - 65,
  );
}

const METHOD_ICONS: Record<PaymentMethod, string> = {
  bank_transfer: "🏦",
  instapay: "📱",
  ewallet: "💳",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  instapay: "InstaPay",
  ewallet: "E-Wallet",
};

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  // Settings from admin
  const [settings, setSettings] = useState<ManualPaymentSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Selected destination
  const [selectedBank, setSelectedBank] = useState<ManualBankAccount | null>(null);
  const [selectedInstapay, setSelectedInstapay] = useState<ManualInstapayAccount | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<ManualWalletAccount | null>(null);

  // Form fields
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings
  useEffect(() => {
    if (!open) return;
    let alive = true;
    setSettingsLoading(true);
    setSettingsError(null);
    fetchManualPaymentSettings()
      .then((data) => {
        if (alive) setSettings(data);
      })
      .catch((err) => {
        if (alive) setSettingsError(err?.message || "Failed to load payment methods");
      })
      .finally(() => {
        if (alive) setSettingsLoading(false);
      });
    return () => { alive = false; };
  }, [open]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep("method");
      setMethod(null);
      setSelectedBank(null);
      setSelectedInstapay(null);
      setSelectedWallet(null);
      setReference("");
      setNote("");
      setFile(null);
      setFilePreview(null);
      setError(null);
      setFileError(null);
    }
  }, [open]);

  // File preview
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreview(null);
  }, [file]);

  const handleFileSelect = useCallback((f: File | null) => {
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.has(f.type)) {
      setFileError("Accepted formats: JPG, PNG, WEBP, PDF");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("Maximum file size is 5 MB");
      return;
    }
    setFile(f);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Check if method is available
  const hasBankAccounts = (settings?.bankAccounts.length ?? 0) > 0;
  const hasInstapay = (settings?.instapayAccounts.length ?? 0) > 0;
  const hasWallet = (settings?.walletAccounts.length ?? 0) > 0;

  function selectMethod(m: PaymentMethod) {
    setMethod(m);

    // If there's only one destination, auto-select it
    if (m === "bank_transfer" && settings?.bankAccounts.length === 1) {
      setSelectedBank(settings.bankAccounts[0]);
      setStep("submit");
    } else if (m === "instapay" && settings?.instapayAccounts.length === 1) {
      setSelectedInstapay(settings.instapayAccounts[0]);
      setStep("submit");
    } else if (m === "ewallet" && settings?.walletAccounts.length === 1) {
      setSelectedWallet(settings.walletAccounts[0]);
      setStep("submit");
    } else {
      setStep("destination");
    }
  }

  function selectDestination(dest: ManualBankAccount | ManualInstapayAccount | ManualWalletAccount) {
    if (method === "bank_transfer") setSelectedBank(dest as ManualBankAccount);
    else if (method === "instapay") setSelectedInstapay(dest as ManualInstapayAccount);
    else if (method === "ewallet") setSelectedWallet(dest as ManualWalletAccount);
    setStep("submit");
  }

  // Build snapshot for the selected destination
  function buildSnapshot(): Record<string, string> {
    if (method === "bank_transfer" && selectedBank) {
      return {
        receivingMethod: "bank_transfer",
        receivingCountry: selectedBank.country || "",
        receivingAccountName: selectedBank.accountHolder || "",
        receivingBankName: selectedBank.bankName || "",
        receivingAccountNumber: selectedBank.accountNumber || "",
        receivingIban: selectedBank.iban || "",
        receivingSwift: selectedBank.swift || "",
        receivingCurrency: selectedBank.currency || "",
      };
    }
    if (method === "instapay" && selectedInstapay) {
      return {
        receivingMethod: "instapay",
        receivingAccountName: selectedInstapay.accountHolder || "",
        receivingInstapayAccount: selectedInstapay.account || "",
      };
    }
    if (method === "ewallet" && selectedWallet) {
      return {
        receivingMethod: "ewallet",
        receivingAccountName: selectedWallet.accountHolder || "",
        receivingWalletProvider: selectedWallet.provider || "",
        receivingWalletNumber: selectedWallet.number || "",
      };
    }
    return {};
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Transaction reference is required.");
      return;
    }
    if (!file) {
      setError("Payment proof screenshot is required.");
      return;
    }

    setError(null);
    try {
      const formData = new FormData();
      formData.append("paymentMethod", method!);
      formData.append("transactionReference", reference);
      formData.append("amount", amount.toString());
      formData.append("currency", "USD");
      if (note) formData.append("note", note);
      formData.append("proof", file);

      // Append destination snapshot
      const snapshot = buildSnapshot();
      for (const [key, value] of Object.entries(snapshot)) {
        if (value) formData.append(key, value);
      }

      await onConfirm(formData);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-electric-600 to-brand-teal text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Manual Payment</h3>
              <p className="text-sm text-white/70 mt-0.5">{projectTitle}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{formatMoney(amount)}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/50">Amount Due</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {(["method", "destination", "submit"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    step === s || (i === 0 && step !== "method") || (i === 1 && step === "submit")
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {settingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-electric-500 border-t-transparent rounded-full" />
            </div>
          ) : settingsError ? (
            <div className="text-center py-8">
              <p className="text-rose-500 text-sm">{settingsError}</p>
              <Button onClick={onClose} variant="ghost" className="mt-4">{t("common.cancel")}</Button>
            </div>
          ) : step === "method" ? (
            <StepChooseMethod
              hasBankAccounts={hasBankAccounts}
              hasInstapay={hasInstapay}
              hasWallet={hasWallet}
              onSelect={selectMethod}
              onClose={onClose}
            />
          ) : step === "destination" && method ? (
            <StepChooseDestination
              method={method}
              settings={settings!}
              onSelect={selectDestination}
              onBack={() => { setStep("method"); setMethod(null); }}
            />
          ) : step === "submit" ? (
            <StepSubmitProof
              method={method!}
              selectedBank={selectedBank}
              selectedInstapay={selectedInstapay}
              selectedWallet={selectedWallet}
              reference={reference}
              setReference={setReference}
              note={note}
              setNote={setNote}
              file={file}
              filePreview={filePreview}
              fileError={fileError}
              error={error}
              loading={loading}
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              onRemoveFile={removeFile}
              onSubmit={handleSubmit}
              onBack={() => {
                // If single destination, go back to method
                const destCount =
                  method === "bank_transfer" ? settings?.bankAccounts.length :
                  method === "instapay" ? settings?.instapayAccounts.length :
                  settings?.walletAccounts.length;
                if (destCount === 1) {
                  setStep("method");
                  setMethod(null);
                } else {
                  setStep("destination");
                }
              }}
              onClose={onClose}
              processingNotice={settings?.processingNotice}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Choose Method ─────────────────────────────────────────────────

function StepChooseMethod({
  hasBankAccounts,
  hasInstapay,
  hasWallet,
  onSelect,
  onClose,
}: {
  hasBankAccounts: boolean;
  hasInstapay: boolean;
  hasWallet: boolean;
  onSelect: (m: PaymentMethod) => void;
  onClose: () => void;
}) {
  const methods: { key: PaymentMethod; available: boolean }[] = [
    { key: "bank_transfer", available: hasBankAccounts },
    { key: "instapay", available: hasInstapay },
    { key: "ewallet", available: hasWallet },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-base font-bold text-slate-900 dark:text-white">
        Choose Payment Method
      </h4>
      <div className="space-y-3">
        {methods.map(({ key, available }) => (
          <button
            key={key}
            disabled={!available}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              available
                ? "border-slate-200 dark:border-slate-700 hover:border-electric-500 hover:bg-electric-50/50 dark:hover:bg-electric-950/20 cursor-pointer active:scale-[0.98]"
                : "border-slate-100 dark:border-slate-800 opacity-40 cursor-not-allowed"
            }`}
          >
            <span className="text-2xl">{METHOD_ICONS[key]}</span>
            <div className="flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {METHOD_LABELS[key]}
              </p>
              {!available && (
                <p className="text-xs text-slate-400">Not configured</p>
              )}
            </div>
            {available && (
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Choose Destination ────────────────────────────────────────────

function StepChooseDestination({
  method,
  settings,
  onSelect,
  onBack,
}: {
  method: PaymentMethod;
  settings: ManualPaymentSettings;
  onSelect: (dest: any) => void;
  onBack: () => void;
}) {
  const destinations =
    method === "bank_transfer" ? settings.bankAccounts :
    method === "instapay" ? settings.instapayAccounts :
    settings.walletAccounts;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          Choose {METHOD_LABELS[method]} Account
        </h4>
      </div>
      <div className="space-y-3">
        {destinations.map((dest: any) => (
          <button
            key={dest.id}
            onClick={() => onSelect(dest)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-electric-500 hover:bg-electric-50/50 dark:hover:bg-electric-950/20 text-left transition-all cursor-pointer active:scale-[0.98]"
          >
            {method === "bank_transfer" && (
              <>
                <span className="text-2xl">{countryFlag((dest as ManualBankAccount).country)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{(dest as ManualBankAccount).bankName}</p>
                  <p className="text-xs text-slate-500 font-mono truncate">{(dest as ManualBankAccount).iban || (dest as ManualBankAccount).accountNumber}</p>
                  <p className="text-xs text-slate-400">{(dest as ManualBankAccount).currency}</p>
                </div>
              </>
            )}
            {method === "instapay" && (
              <>
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{(dest as ManualInstapayAccount).account}</p>
                  {(dest as ManualInstapayAccount).accountHolder && (
                    <p className="text-xs text-slate-500">{(dest as ManualInstapayAccount).accountHolder}</p>
                  )}
                </div>
              </>
            )}
            {method === "ewallet" && (
              <>
                <span className="text-2xl">💳</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{(dest as ManualWalletAccount).provider}</p>
                  <p className="text-xs text-slate-500 font-mono">{(dest as ManualWalletAccount).number}</p>
                </div>
              </>
            )}
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Submit Payment Proof ──────────────────────────────────────────

function StepSubmitProof({
  method,
  selectedBank,
  selectedInstapay,
  selectedWallet,
  reference,
  setReference,
  note,
  setNote,
  file,
  filePreview,
  fileError,
  error,
  loading,
  fileInputRef,
  onFileSelect,
  onRemoveFile,
  onSubmit,
  onBack,
  onClose,
  processingNotice,
}: {
  method: PaymentMethod;
  selectedBank: ManualBankAccount | null;
  selectedInstapay: ManualInstapayAccount | null;
  selectedWallet: ManualWalletAccount | null;
  reference: string;
  setReference: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  file: File | null;
  filePreview: string | null;
  fileError: string | null;
  error: string | null;
  loading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (f: File | null) => void;
  onRemoveFile: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onClose: () => void;
  processingNotice?: string | null;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Back button + method label */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {METHOD_ICONS[method]} {METHOD_LABELS[method]}
        </h4>
      </div>

      {/* Destination details card */}
      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Transfer To</p>
        {method === "bank_transfer" && selectedBank && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Country</span>
              <span className="font-medium">{countryFlag(selectedBank.country)} {selectedBank.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank</span>
              <span className="font-medium">{selectedBank.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Holder</span>
              <span className="font-medium">{selectedBank.accountHolder}</span>
            </div>
            {selectedBank.iban && (
              <div className="flex justify-between">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 select-all">{selectedBank.iban}</span>
              </div>
            )}
            {selectedBank.accountNumber && !selectedBank.iban && (
              <div className="flex justify-between">
                <span className="text-slate-500">Account No.</span>
                <span className="font-mono text-xs">{selectedBank.accountNumber}</span>
              </div>
            )}
            {selectedBank.swift && (
              <div className="flex justify-between">
                <span className="text-slate-500">SWIFT/BIC</span>
                <span className="font-mono text-xs">{selectedBank.swift}</span>
              </div>
            )}
            {selectedBank.currency && (
              <div className="flex justify-between">
                <span className="text-slate-500">Currency</span>
                <span className="font-medium">{selectedBank.currency}</span>
              </div>
            )}
          </div>
        )}
        {method === "instapay" && selectedInstapay && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">InstaPay Account</span>
              <span className="font-mono font-semibold select-all">{selectedInstapay.account}</span>
            </div>
            {selectedInstapay.accountHolder && (
              <div className="flex justify-between">
                <span className="text-slate-500">Account Holder</span>
                <span className="font-medium">{selectedInstapay.accountHolder}</span>
              </div>
            )}
          </div>
        )}
        {method === "ewallet" && selectedWallet && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Provider</span>
              <span className="font-medium">{selectedWallet.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Wallet Number</span>
              <span className="font-mono font-semibold select-all">{selectedWallet.number}</span>
            </div>
            {selectedWallet.accountHolder && (
              <div className="flex justify-between">
                <span className="text-slate-500">Account Holder</span>
                <span className="font-medium">{selectedWallet.accountHolder}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {processingNotice && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
          {processingNotice}
        </div>
      )}

      {/* Transaction Reference */}
      <Field label="Transaction Reference *" error={error && !reference.trim() ? "Required" : undefined}>
        <Input
          placeholder="e.g. ABC123456789"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </Field>

      {/* Proof Upload */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Payment Screenshot *
        </label>
        <p className="text-xs text-slate-500">Upload a screenshot of your transaction confirmation.</p>

        {!file ? (
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-electric-500 hover:bg-electric-50/30 dark:hover:bg-electric-950/10 ${
              fileError
                ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/10"
                : "border-slate-300 dark:border-slate-700"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) onFileSelect(f);
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">📷</span>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Click or drag to upload
              </p>
              <p className="text-xs text-slate-400">
                JPG, PNG, WEBP, PDF — max 5 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
              className="sr-only"
            />
          </div>
        ) : (
          <div className="relative border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            {filePreview ? (
              <div className="p-3 flex items-center gap-4">
                <img
                  src={filePreview}
                  alt="Proof preview"
                  className="h-20 w-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="p-3 flex items-center gap-4">
                <div className="h-20 w-20 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-2xl">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
            <div className="flex border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 text-xs font-semibold text-electric-600 dark:text-electric-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Replace
              </button>
              <div className="w-px bg-slate-100 dark:bg-slate-800" />
              <button
                type="button"
                onClick={onRemoveFile}
                className="flex-1 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
              >
                Remove
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
              className="sr-only"
            />
          </div>
        )}
        {fileError && (
          <p className="text-xs text-rose-500 font-medium">{fileError}</p>
        )}
      </div>

      {/* Optional Note */}
      <Field label="Note (Optional)">
        <Input
          placeholder="Any additional info about this payment"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      {error && (
        <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-lg" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Payment Proof"}
        </Button>
      </div>
    </form>
  );
}
