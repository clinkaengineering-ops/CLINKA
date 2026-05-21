"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/admin",
  "/messages",
  "/escrow",
  "/reviews",
  "/checkout",
];

const ADMIN_PREFIXES = ["/admin"];

/** Client/engineer workspace routes — admins use /admin instead */
const ADMIN_BLOCKED_PREFIXES = [
  "/dashboard",
  "/messages",
  "/escrow",
  "/reviews",
  "/my-bids",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, sessionReady, setSessionReady } = useAuthStore();
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setSessionReady(false);
      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          setSessionReady(true);
          setBootstrapping(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setUser, setSessionReady]);

  useEffect(() => {
    if (bootstrapping || !sessionReady) return;

    const needsAuth = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (needsAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const needsAdmin = ADMIN_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (needsAdmin && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }

    if (user?.role === "ADMIN") {
      const onBlocked = ADMIN_BLOCKED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (onBlocked) {
        router.replace("/admin");
      }
    }
  }, [bootstrapping, sessionReady, pathname, router, user]);

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if ((bootstrapping || !sessionReady) && needsAuth) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
