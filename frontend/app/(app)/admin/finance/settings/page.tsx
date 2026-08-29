"use client";

import { useEffect, useState } from "react";
import { Card, Button, Input } from "@/components/UI";
import { fetchManualPaymentSettings, updateManualPaymentSettings } from "@/features/admin/api/admin.finance.api";

export default function FinanceSettingsPage() {
  const [settings, setSettings] = useState<any>({});
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
      setSettings(data || {
        bankTransfer: { enabled: true, bankName: "", accountHolder: "", accountNumber: "", iban: "" },
        instapay: { enabled: true, account: "" },
        mobileWallet: { enabled: true, provider: "", number: "" },
        processingNotice: "Payments are manually verified and may take 24–48 hours."
      });
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (category: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleTextChange = (field: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateManualPaymentSettings(settings);
      alert("Settings saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Manual Payment Methods</h2>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <h3 className="font-bold">Bank Transfer</h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input type="checkbox" checked={settings.bankTransfer?.enabled} onChange={(e) => handleChange("bankTransfer", "enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-semibold mb-1 block">Bank Name</label><Input value={settings.bankTransfer?.bankName || ""} onChange={(e) => handleChange("bankTransfer", "bankName", e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">Account Holder</label><Input value={settings.bankTransfer?.accountHolder || ""} onChange={(e) => handleChange("bankTransfer", "accountHolder", e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">Account Number</label><Input value={settings.bankTransfer?.accountNumber || ""} onChange={(e) => handleChange("bankTransfer", "accountNumber", e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">IBAN</label><Input value={settings.bankTransfer?.iban || ""} onChange={(e) => handleChange("bankTransfer", "iban", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <h3 className="font-bold">InstaPay</h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input type="checkbox" checked={settings.instapay?.enabled} onChange={(e) => handleChange("instapay", "enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-semibold mb-1 block">InstaPay Account</label><Input value={settings.instapay?.account || ""} onChange={(e) => handleChange("instapay", "account", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <h3 className="font-bold">Mobile Wallet</h3>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
            <input type="checkbox" checked={settings.mobileWallet?.enabled} onChange={(e) => handleChange("mobileWallet", "enabled", e.target.checked)} />
            Enabled
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-semibold mb-1 block">Wallet Provider (e.g. Vodafone Cash)</label><Input value={settings.mobileWallet?.provider || ""} onChange={(e) => handleChange("mobileWallet", "provider", e.target.value)} /></div>
          <div><label className="text-sm font-semibold mb-1 block">Wallet Number</label><Input value={settings.mobileWallet?.number || ""} onChange={(e) => handleChange("mobileWallet", "number", e.target.value)} /></div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="font-bold border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">Client Notice</h3>
        <div>
          <label className="block text-sm font-semibold mb-1 text-slate-700 dark:text-slate-300">Processing Notice Text</label>
          <textarea
            className="w-full h-24 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
            value={settings.processingNotice || ""}
            onChange={(e) => handleTextChange("processingNotice", e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
}
