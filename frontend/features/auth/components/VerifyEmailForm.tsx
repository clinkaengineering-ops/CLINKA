"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { Card, Button,  } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
type Status = "loading" | "success" | "error";

export function VerifyEmailForm() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";

      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await authApi.verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(res?.data?.message || "Email verified successfully.");
      } catch (error: any) {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          error?.response?.data?.message || "Verification failed. The link may be invalid or expired.",
        );
      }
    }

    runVerification();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="p-6 sm:p-8">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mx-auto text-xl">
              ...
            </div>
            <h1 className="text-2xl font-bold">Verifying email</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold">Email verified</h1>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center mx-auto text-xl">
              !
            </div>
            <h1 className="text-2xl font-bold">Verification failed</h1>
          </>
        )}

        <p className="text-sm text-slate-500">{message}</p>

        <Link href="/login" className="block">
          <Button className="w-full" icon={<IconArrow width={14} height={14} />}>
            Go to login
          </Button>
        </Link>
      </div>
    </Card>
  );
}
