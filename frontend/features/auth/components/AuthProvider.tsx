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
  "/balance",
  "/reviews",
  "/checkout",
];

const ADMIN_PREFIXES = ["/admin"];

/** Client/engineer workspace routes — admins use /admin instead */
const ADMIN_BLOCKED_PREFIXES = [
  "/dashboard",
  "/messages",
  "/escrow",
  "/balance",
  "/reviews",
  "/my-bids",
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionReady = useAuthStore((s) => s.setSessionReady);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []); // run once on mount

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