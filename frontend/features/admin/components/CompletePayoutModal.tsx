"use client";

import { useState } from "react";
import { Button, Card, Input, Field } from "@/components/UI";
import { useI18n } from "@/i18n";

interface CompletePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { transferReference: string; transferMethod?: string; notes?: string; proofFile?: File }) => Promise<void>;
  amount: number;
}

export function CompletePayoutModal({ isOpen, onClose, onSubmit, amount }: CompletePayoutModalProps) {
  const { t } = useI18n();
  const [transferReference, setTransferReference] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferReference.trim()) {
      setError("Transfer reference is required.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you have sent the money.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({ transferReference, notes, proofFile: proofFile ?? undefined });
      setTransferReference("");
      setNotes("");
      setProofFile(null);
      setConfirmed(false);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="mb-4 text-lg font-bold">Confirm Money Sent</h2>
        <p className="mb-4 text-sm text-slate-500">
          You are confirming that <strong>${amount}</strong> has been transferred.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Transaction / Transfer Reference *">
            <Input
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              placeholder="e.g. FT123456789"
              required
              disabled={loading}
            />
          </Field>
          <Field label="Optional Note">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details"
              disabled={loading}
            />
          </Field>
          
          <div>
            <label className="mb-1 block text-sm font-medium">Transfer Proof (Optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              className="w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              disabled={loading}
            />
            {proofFile && <p className="mt-1 text-xs text-slate-500">{proofFile.name}</p>}
          </div>

          <label className="flex items-center gap-2 mt-4 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            I confirm that I have sent this payout to the engineer.
          </label>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !confirmed || !transferReference.trim()}>
              Confirm Money Sent
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
