"use client";
import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { Button, Card, Field, Input } from "@/components/UI";
import { IconArrow, IconMail } from "@/components/Icons";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent)
    return (
      <Card >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-slate-500">
            We sent a reset link to <strong>{email}</strong>
          </p>
          <Link href="/login" className="text-electric-600 text-sm font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </Card>
    );

  return (
    <Card>
      <h1 className="text-2xl font-bold">Reset password</h1>
      <p className="text-sm text-slate-500 mt-1">Enter your email and we&apos;ll send you a reset link</p>

      <div className="mt-6 space-y-4">
        <Field label="Email">
          <Input
            icon={<IconMail width={16} height={16} />}
            type="email"
            placeholder="you@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Button
          onClick={handleSubmit}
          disabled={loading || !email}
          className="w-full"
          icon={<IconArrow width={14} height={14} />}
        >
          {loading ? "Sending..." : "Send reset link"}
        </Button>

        <Link href="/login" className="block text-center text-sm text-electric-600 font-semibold hover:underline">
          Back to login
        </Link>
      </div>
    </Card>
  );
}
