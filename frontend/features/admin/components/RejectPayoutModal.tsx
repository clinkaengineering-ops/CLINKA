"use client";

import { useState } from "react";
import { Button, Card, Input, Field } from "@/components/UI";
import { useI18n } from "@/i18n";

interface RejectPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; notes?: string }) => Promise<void>;
  amount: number;
}

export function RejectPayoutModal({ isOpen, onClose, onSubmit, amount }: RejectPayoutModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({ reason, notes });
      setReason("");
      setNotes("");
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6 border-t-4 border-t-rose-500">
        <h2 className="mb-4 text-lg font-bold text-rose-600">Reject Payout</h2>
        <p className="mb-4 text-sm text-slate-500">
          You are rejecting a withdrawal request for <strong>${amount}</strong>. This will release the funds back to the engineer's available balance.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Rejection Reason *">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Invalid IBAN number"
              required
              disabled={loading}
            />
          </Field>
          <Field label="Optional Note (Internal)">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra details for admin reference"
              disabled={loading}
            />
          </Field>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !reason.trim()} className="bg-rose-600 hover:bg-rose-700 text-white">
              Reject Payout
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
