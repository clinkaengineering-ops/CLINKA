"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { NavbarActions } from "@/components/NavbarActions";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import useAuthStore from "@/store/authStore";

function AuthNavSkeleton({ stacked }: { stacked?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", stacked && "w-full flex-col")} aria-hidden>
      <div className="h-9 w-full max-w-[7.5rem] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="h-9 w-full max-w-[7.5rem] rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    </div>
  );
}

export function AuthNavSlot({
  stacked = false,
  showInbox = true,
  onNavigate,
}: {
  stacked?: boolean;
  showInbox?: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { authResolved, user } = useAuthHydration();
  const logout = useAuthStore((s) => s.logout);

  if (!authResolved) {
    return <AuthNavSkeleton stacked={stacked} />;
  }

  if (user) {
    if (stacked) {
      return (
        <div className="flex w-full flex-col gap-3">
          <div className="flex items-center justify-center gap-2 py-1">
            <NavbarActions showInbox={showInbox} stacked={stacked} />
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await logout();
              onNavigate?.();
              router.push("/login");
            }}
          >
            {t("nav.signOut")}
          </Button>
        </div>
      );
    }

    return (
      <>
        <NavbarActions showInbox={showInbox} stacked={stacked} />
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await logout();
            router.push("/login");
          }}
        >
          {t("nav.signOut")}
        </Button>
      </>
    );
  }

  if (stacked) {
    return (
      <div className="flex w-full flex-col gap-3">
        <Link href="/login" onClick={onNavigate} className="w-full">
          <Button variant="secondary" className="w-full">
            {t("auth.signin")}
          </Button>
        </Link>
        <Link href="/register" onClick={onNavigate} className="w-full">
          <Button className="w-full">{t("auth.create")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm">
          {t("auth.signin")}
        </Button>
      </Link>
      <Link href="/register">
        <Button size="sm">{t("auth.create")}</Button>
      </Link>
    </>
  );
}
