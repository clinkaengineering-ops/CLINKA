"use client";
import { useState } from "react";
import { useVerifyOtp } from "@/features/auth/hooks/useVerifyOtp";
import {
  verifyOtpFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { Button, Card } from "@/components/UI";
import { IconArrow } from "@/components/Icons";

export function VerifyOtpForm() {
  const { verifyOtp, loading, error } = useVerifyOtp();
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit() {
    const result = validateForm(verifyOtpFormSchema, { otp });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    await verifyOtp(result.data.otp);
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code we sent you</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 6);
              setOtp(v);
              if (fieldErrors.otp) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.otp;
                  return next;
                });
              }
            }}
            className={`w-full h-12 rounded-lg border bg-white dark:bg-slate-900 px-4 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 transition ${
              fieldErrors.otp
                ? "border-rose-500 focus:ring-rose-500/30"
                : "border-slate-200 dark:border-slate-800 focus:ring-electric-500/30"
            }`}
          />
          {fieldErrors.otp && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.otp}</p>
          )}
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          icon={<IconArrow width={14} height={14} />}
          disabled={loading}
        >
          {loading ? "Verifying…" : "Verify & sign in"}
        </Button>
      </div>
    </Card>
  );
}
