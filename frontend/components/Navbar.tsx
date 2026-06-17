"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/UI";
import { IconLogo } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { NavbarActions } from "@/components/NavbarActions";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/theme";

const navItems = [
  { href: "/", label: "side.home" },
  { href: "/engineers", label: "side.findEngineers" },
  { href: "/projects", label: "side.findProjects" },
  { href: "/about", label: "nav.about" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-900/80 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-400 to-navy-700 text-white shadow-lg shadow-electric-500/20">
            <IconLogo width={20} height={20} />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
              CLINKA
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("brand.tagline")}</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-electric-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle compact />
          <ThemeToggle compact />
          {user ? (
            <>
              <NavbarActions showInbox />
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                {t("nav.signOut")}
              </Button>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </header>
  );
}
