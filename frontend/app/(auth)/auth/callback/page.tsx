"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";
import { Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import { LoadingFallback } from "@/components/LoadingFallback";

function GoogleCallbackContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const signingInMessage = t("auth.callback.signingIn");
  const initialMessage = error
    ? decodeURIComponent(error)
    : success !== "1"
      ? t("auth.callback.cancelled")
      : signingInMessage;
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    if (error || success !== "1") return;

    let cancelled = false;

    async function finish() {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me);

        const next = searchParams.get("next");
        const safeNext =
          next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

        router.replace(safeNext);
      } catch {
        if (!cancelled) {
          setMessage(t("auth.callback.sessionFailed"));
        }
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [error, success, searchParams, router, setUser, t]);

  const isError =
    searchParams.get("error") ||
    searchParams.get("success") !== "1" ||
    message !== signingInMessage;

  return (
    <Card className="p-6 sm:p-8 text-center space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {isError ? t("auth.callback.issueTitle") : t("auth.callback.almostTitle")}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {isError && (
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-electric-600 hover:underline"
        >
          {t("auth.forgot.backLogin")}
        </Link>
      )}
    </Card>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6 sm:p-8 text-center">
          <LoadingFallback />
        </Card>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
