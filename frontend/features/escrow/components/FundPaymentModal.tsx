"use client";

import { useState, useEffect } from "react";
import { Button, Field, Input } from "@/components/UI";
import { useI18n } from "@/i18n";
import {
  fundPaymentFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import type { PaymentMethodOption } from "../types";
import { formatMoney } from "../utils/formatMoney";

export function FundPaymentModal({
  open,
  onClose,
  projectTitle,
  amount,
  methods,
  methodsLoading,
  loading,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  projectTitle: string;
  amount: number;
  methods: PaymentMethodOption[];
  methodsLoading: boolean;
  loading: boolean;
  onConfirm: (
    paymentMethodId: number,
    phone: string,
    address: string,
  ) => Promise<void>;
}) {
  const { t, lang } = useI18n();
  const [methodId, setMethodId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Reset form state whenever the modal opens so stale selections don't persist
  useEffect(() => {
    if (open) {
      setMethodId(null);
      setPhone("");
      setAddress(""); // ADD THIS
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateForm(fundPaymentFormSchema, {
      paymentMethodId: methodId ?? 0,
      phone,
      address, // ADD THIS
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      if (result.errors.paymentMethodId) {
        setError(result.errors.paymentMethodId);
      }
      return;
    }
    setFieldErrors({});
    setError(null);
    try {
      await onConfirm(
        result.data.paymentMethodId,
        result.data.phone,
        result.data.address ?? "",
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold">{t("es.fundTitle")}</h3>
            <p className="text-sm text-slate-500 mt-1">{projectTitle}</p>
            <p className="text-xl font-bold text-electric-600 dark:text-electric-400 mt-2">
              {formatMoney(amount)}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              {t("es.payMethods")}
            </p>
            {methodsLoading ? (
              <p className="text-sm text-slate-500">{t("common.loading")}</p>
            ) : methods.length === 0 ? (
              <p className="text-sm text-rose-500">{t("es.noMethods")}</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {methods.map((m) => (
                  <label
                    key={m.paymentId}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      methodId === m.paymentId
                        ? "border-electric-500 bg-electric-500/5"
                        : "border-slate-200 dark:border-slate-800 hover:border-electric-500/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      className="accent-electric-500"
                      checked={methodId === m.paymentId}
                      onChange={() => setMethodId(m.paymentId)}
                    />
                    <span className="text-sm font-medium">
                      {lang === "ar" ? m.name_ar : m.name_en}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Field label={t("es.phoneLabel")} error={fieldErrors.phone}>
            <Input
              placeholder="01012345678"
              value={phone}
              error={!!fieldErrors.phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          
          <Field label="Address" error={fieldErrors.address}>
            <Input
              placeholder="Your billing address"
              value={address}
              error={!!fieldErrors.address}
              onChange={(e) => setAddress(e.target.value)}
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
            <Button type="submit" disabled={loading || methods.length === 0}>
              {loading ? t("es.processing") : t("common.fund")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
