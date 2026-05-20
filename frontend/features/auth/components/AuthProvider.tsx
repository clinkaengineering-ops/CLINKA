"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";

const PROTECTED_PREFIXES = ["/dashboard", "/settings", "/admin", "/messages"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
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
        if (!cancelled) setBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  useEffect(() => {
    if (bootstrapping) return;
    const needsAuth = PROTECTED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (needsAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [bootstrapping, pathname, router, user]);

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (bootstrapping && needsAuth) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
