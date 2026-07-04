"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";
import { Card, Button } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";

type Status = "loading" | "success" | "error";

export function VerifyEmailForm() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setMessage(t("auth.verifyEmail.verifying"));

    async function runVerification() {
      const token = new URLSearchParams(window.location.search).get("token") ?? "";

      if (!token) {
        setStatus("error");
        setMessage(t("auth.verifyEmail.missingToken"));
        return;
      }

      try {
        const res = await authApi.verifyEmail(token);
        if (cancelled) return;
        setStatus("success");
        setMessage(res?.data?.message || t("auth.verifyEmail.successMsg"));
      } catch (error: unknown) {
        if (cancelled) return;
        setStatus("error");
        const apiMessage =
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response &&
          error.response.data &&
          typeof error.response.data === "object" &&
          "message" in error.response.data &&
          typeof error.response.data.message === "string"
            ? error.response.data.message
            : null;
        setMessage(apiMessage ?? t("auth.verifyEmail.failedMsg"));
      }
    }

    runVerification();

    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <Card className="p-6 sm:p-8">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center mx-auto text-xl">
              ...
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verifyEmail.loading")}</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verifyEmail.success")}</h1>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center mx-auto text-xl">
              !
            </div>
            <h1 className="text-2xl font-bold">{t("auth.verifyEmail.failed")}</h1>
          </>
        )}

        <p className="text-sm text-slate-500">{message}</p>

        <Link href="/login" className="block">
          <Button className="w-full" icon={<IconArrow width={14} height={14} />}>
            {t("auth.verifyEmail.goLogin")}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
