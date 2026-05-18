"use client";
import { useState } from "react";
import { useVerifyOtp } from "@/features/auth/hooks/useVerifyOtp";
import { Button, Card} from "@/components/UI";
import { IconArrow } from "@/components/Icons";
export function VerifyOtpForm() {
  const { verifyOtp, loading, error } = useVerifyOtp();
  const [otp, setOtp] = useState("");

  return (
    <Card>
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code we sent you</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          placeholder="000000"
          maxLength={6}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-electric-500"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/, ""))}
        />

        <Button
          onClick={() => verifyOtp(otp)}
          disabled={loading || otp.length !== 6}
          className="w-full"
          icon={<IconArrow width={14} height={14} />}
        >
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </Card>
  );
}
