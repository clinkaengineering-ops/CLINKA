"use client";
import { useState } from "react";
import Link from "next/link";
import { useLogin } from "@/features/auth/hooks/useLogin";
import {
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthField,
  AuthInput,
  IconArrow,
  IconEye,
  IconLock,
  IconMail,
} from "@/components/auth-ui";

export default function LoginPage() {
  const { login, loading, error } = useLogin();
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-rose-500">{error}</p>}

        <AuthField label="Email">
          <AuthInput
            icon={<IconMail width={16} height={16} />}
            type="email"
            placeholder="you@firm.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </AuthField>

        <AuthField
          label="Password"
          right={
            <Link href="/forgot-password" className="text-xs text-electric-600 hover:text-electric-500 font-medium">
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <AuthInput
              icon={<IconLock width={16} height={16} />}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <IconEye width={16} height={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </AuthField>

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-electric-500" defaultChecked />
          Keep me signed in
        </label>

        <AuthButton className="w-full" onClick={() => login(form.email, form.password)} icon={<IconArrow width={14} height={14} />} disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </AuthButton>

        <AuthDivider />

        <div className="grid grid-cols-2 gap-3">
          <AuthButton variant="secondary" className="!h-11">Google</AuthButton>
          <AuthButton variant="secondary" className="!h-11">SSO</AuthButton>
        </div>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-electric-600 font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}