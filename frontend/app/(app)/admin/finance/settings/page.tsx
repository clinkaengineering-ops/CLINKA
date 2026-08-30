"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input, Badge } from "@/components/UI";
import { fetchManualPaymentSettings, updateManualPaymentSettings } from "@/features/admin/api/admin.finance.api";

function generateId() {
  return `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface BankAccount {
  id: string;
  country: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban: string;
  swift: string;
  currency: string;
  enabled: boolean;
}

interface InstapayAccount {
  id: string;
  account: string;
  accountHolder: string;
  enabled: boolean;
}

interface WalletAccount {
  id: string;
  provider: string;
  number: string;
  accountHolder: string;
  enabled: boolean;
}

const EMPTY_BANK: BankAccount = { id: "", country: "EG", bankName: "", accountHolder: "", accountNumber: "", iban: "", swift: "", currency: "EGP", enabled: true };
const EMPTY_INSTAPAY: InstapayAccount = { id: "", account: "", accountHolder: "", enabled: true };
const EMPTY_WALLET: WalletAccount = { id: "", provider: "", number: "", accountHolder: "", enabled: true };

export default function FinanceSettingsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [instapayAccounts, setInstapayAccounts] = useState<InstapayAccount[]>([]);
  const [walletAccounts, setWalletAccounts] = useState<WalletAccount[]>([]);
  const [processingNotice, setProcessingNotice] = useState("");

  // Legacy toggles
  const [bankEnabled, setBankEnabled] = useState(true);
  const [instapayEnabled, setInstapayEnabled] = useState(true);
  const [walletEnabled, setWalletEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchManualPaymentSettings();
      if (!data) {
        // Defaults
        setBankAccounts([]);
        setInstapayAccounts([]);
        setWalletAccounts([]);
        return;
      }

      // Parse multi-account format OR legacy format
      if (Array.isArray(data.bankAccounts)) {
        setBankAccounts(data.bankAccounts);
      } else if (data.bankTransfer) {
        setBankEnabled(data.bankTransfer.enabled !== false);
        if (data.bankTransfer.bankName || data.bankTransfer.iban || data.bankTransfer.accountNumber) {
          setBankAccounts([{
            id: generateId(),
            country: data.bankTransfer.country || "EG",
            bankName: data.bankTransfer.bankName || "",
            accountHolder: data.bankTransfer.accountHolder || "",
            accountNumber: data.bankTransfer.accountNumber || "",
            iban: data.bankTransfer.iban || "",
            swift: data.bankTransfer.swift || "",
            currency: data.bankTransfer.currency || "EGP",
            enabled: true,
          }]);
        }
      }

      if (Array.isArray(data.instapayAccounts)) {
        setInstapayAccounts(data.instapayAccounts);
      } else if (data.instapay) {
        setInstapayEnabled(data.instapay.enabled !== false);
        if (data.instapay.account) {
          setInstapayAccounts([{
            id: generateId(),
            account: data.instapay.account || "",
            accountHolder: data.instapay.accountHolder || "",
            enabled: true,
          }]);
        }
      }

      if (Array.isArray(data.walletAccounts)) {
        setWalletAccounts(data.walletAccounts);
      } else if (data.mobileWallet) {
        setWalletEnabled(data.mobileWallet.enabled !== false);
        if (data.mobileWallet.number) {
          setWalletAccounts([{
            id: generateId(),
            provider: data.mobileWallet.provider || "",
            number: data.mobileWallet.number || "",
            accountHolder: data.mobileWallet.accountHolder || "",
            enabled: true,
          }]);
        }
      }

      setProcessingNotice(data.processingNotice || "");
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save in the new multi-account format while keeping backward-compat keys
      await updateManualPaymentSettings({
        bankTransfer: { enabled: bankEnabled },
        instapay: { enabled: instapayEnabled },
        mobileWallet: { enabled: walletEnabled },
        bankAccounts: bankAccounts.map(a => ({ ...a, id: a.id || generateId() })),
        instapayAccounts: instapayAccounts.map(a => ({ ...a, id: a.id || generateId() })),
        walletAccounts: walletAccounts.map(a => ({ ...a, id: a.id || generateId() })),
        processingNotice,
      });
      alert("Settings saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addBank = () => setBankAccounts(prev => [...prev, { ...EMPTY_BANK, id: generateId() }]);
  const removeBank = (id: string) => setBankAccounts(prev => prev.filter(a => a.id !== id));
  const updateBank = (id: string, field: keyof BankAccount, value: any) => {
    setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addInstapay = () => setInstapayAccounts(prev => [...prev, { ...EMPTY_INSTAPAY, id: generateId() }]);
  const removeInstapay = (id: string) => setInstapayAccounts(prev => prev.filter(a => a.id !== id));
  const updateInstapay = (id: string, field: keyof InstapayAccount, value: any) => {
    setInstapayAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addWallet = () => setWalletAccounts(prev => [...prev, { ...EMPTY_WALLET, id: generateId() }]);
  const removeWallet = (id: string) => setWalletAccounts(prev => prev.filter(a => a.id !== id));
  const updateWallet = (id: string, field: keyof WalletAccount, value: any) => {
    setWalletAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Manual Payment Methods</h2>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
      </div>

      {/* ─── Bank Transfer Accounts ──────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <h3 className="font-bold">Bank Transfer</h3>
            <Badge color={bankEnabled ? "green" : "slate"}>{bankEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input type="checkbox" checked={bankEnabled} onChange={(e) => setBankEnabled(e.target.checked)} />
              Enabled
            </label>
            <Button onClick={addBank} size="sm" variant="secondary">+ Add Account</Button>
          </div>
        </div>

        {bankAccounts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No bank accounts configured. Click &quot;Add Account&quot; to add one.</p>
        ) : (
          <div className="space-y-4">
            {bankAccounts.map((acc, idx) => (
              <div key={acc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Account #{idx + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" checked={acc.enabled} onChange={(e) => updateBank(acc.id, "enabled", e.target.checked)} />
                      Active
                    </label>
                    <button
                      onClick={() => removeBank(acc.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Country Code (ISO)</label>
                    <Input value={acc.country} onChange={(e) => updateBank(acc.id, "country", e.target.value)} placeholder="e.g. SA, EG" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Currency</label>
                    <Input value={acc.currency} onChange={(e) => updateBank(acc.id, "currency", e.target.value)} placeholder="e.g. SAR, EGP" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Bank Name</label>
                    <Input value={acc.bankName} onChange={(e) => updateBank(acc.id, "bankName", e.target.value)} placeholder="Saudi National Bank" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Account Holder</label>
                    <Input value={acc.accountHolder} onChange={(e) => updateBank(acc.id, "accountHolder", e.target.value)} placeholder="CLINKA" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Account Number</label>
                    <Input value={acc.accountNumber} onChange={(e) => updateBank(acc.id, "accountNumber", e.target.value)} placeholder="123456789" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">IBAN</label>
                    <Input value={acc.iban} onChange={(e) => updateBank(acc.id, "iban", e.target.value)} placeholder="SA0000000000000000000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">SWIFT/BIC</label>
                    <Input value={acc.swift} onChange={(e) => updateBank(acc.id, "swift", e.target.value)} placeholder="BSFRSARI" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── InstaPay Accounts ───────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <h3 className="font-bold">InstaPay</h3>
            <Badge color={instapayEnabled ? "green" : "slate"}>{instapayEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input type="checkbox" checked={instapayEnabled} onChange={(e) => setInstapayEnabled(e.target.checked)} />
              Enabled
            </label>
            <Button onClick={addInstapay} size="sm" variant="secondary">+ Add Account</Button>
          </div>
        </div>

        {instapayAccounts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No InstaPay accounts configured.</p>
        ) : (
          <div className="space-y-3">
            {instapayAccounts.map((acc, idx) => (
              <div key={acc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Account #{idx + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" checked={acc.enabled} onChange={(e) => updateInstapay(acc.id, "enabled", e.target.checked)} />
                      Active
                    </label>
                    <button onClick={() => removeInstapay(acc.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition">Remove</button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">InstaPay Account</label>
                    <Input value={acc.account} onChange={(e) => updateInstapay(acc.id, "account", e.target.value)} placeholder="@clinka" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Account Holder</label>
                    <Input value={acc.accountHolder} onChange={(e) => updateInstapay(acc.id, "accountHolder", e.target.value)} placeholder="CLINKA" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── E-Wallet Accounts ───────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <h3 className="font-bold">E-Wallet</h3>
            <Badge color={walletEnabled ? "green" : "slate"}>{walletEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input type="checkbox" checked={walletEnabled} onChange={(e) => setWalletEnabled(e.target.checked)} />
              Enabled
            </label>
            <Button onClick={addWallet} size="sm" variant="secondary">+ Add Account</Button>
          </div>
        </div>

        {walletAccounts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No e-wallet accounts configured.</p>
        ) : (
          <div className="space-y-3">
            {walletAccounts.map((acc, idx) => (
              <div key={acc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Account #{idx + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input type="checkbox" checked={acc.enabled} onChange={(e) => updateWallet(acc.id, "enabled", e.target.checked)} />
                      Active
                    </label>
                    <button onClick={() => removeWallet(acc.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold transition">Remove</button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Provider</label>
                    <Input value={acc.provider} onChange={(e) => updateWallet(acc.id, "provider", e.target.value)} placeholder="Vodafone Cash" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Wallet Number</label>
                    <Input value={acc.number} onChange={(e) => updateWallet(acc.id, "number", e.target.value)} placeholder="010XXXXXXXX" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Account Holder</label>
                    <Input value={acc.accountHolder} onChange={(e) => updateWallet(acc.id, "accountHolder", e.target.value)} placeholder="CLINKA" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Client Notice ───────────────────────────────────────────────── */}
      <Card className="p-5 space-y-4">
        <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Client Notice</h3>
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Processing Notice Text</label>
          <textarea
            className="w-full h-24 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
            value={processingNotice}
            onChange={(e) => setProcessingNotice(e.target.value)}
            placeholder="Payments are manually verified and may take 24–48 hours."
          />
        </div>
      </Card>
    </div>
  );
}
