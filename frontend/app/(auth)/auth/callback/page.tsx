"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";
import { Card } from "@/components/UI";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage(decodeURIComponent(error));
      return;
    }

    if (searchParams.get("success") !== "1") {
      setMessage("Google sign-in was cancelled.");
      return;
    }

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
          setMessage("Signed in with Google but session could not be loaded. Try logging in again.");
        }
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router, setUser]);

  const isError =
    searchParams.get("error") ||
    searchParams.get("success") !== "1" ||
    message !== "Signing you in…";

  return (
    <Card className="p-6 sm:p-8 text-center space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {isError ? "Sign-in issue" : "Almost there"}
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {isError && (
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-electric-600 hover:underline"
        >
          Back to login
        </Link>
      )}
    </Card>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6 sm:p-8 text-center text-sm text-slate-500">Loading…</Card>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
