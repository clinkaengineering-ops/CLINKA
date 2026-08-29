"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLink } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";
import { AuthNavSlot } from "@/components/AuthNavSlot";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/theme";
import { IconClose, IconMenu } from "@/components/Icons";
import { cn } from "@/utils/cn";

const navItems = [
  { href: "/", label: "side.home" },
  { href: "/engineers", label: "side.findEngineers" },
  { href: "/projects", label: "side.findProjects" },
  { href: "/about", label: "nav.about" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-900/80 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLink logoClassName="h-12 w-auto sm:h-14" priority />

        <nav className="hidden md:flex items-center gap-6" aria-label="Main">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-brand-teal font-semibold"
                    : "text-slate-600 hover:text-brand-teal dark:text-slate-400 dark:hover:text-white"
                }
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <LangToggle compact />
          <ThemeToggle compact />
          <AuthNavSlot />
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <LangToggle compact />
          <ThemeToggle compact />
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileOpen ? <IconClose width={20} height={20} /> : <IconMenu width={20} height={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      <nav
        id="marketing-mobile-nav"
        className={cn(
          "md:hidden fixed inset-x-0 top-16 z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 transition-transform duration-200",
          mobileOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-2 opacity-0 invisible pointer-events-none",
        )}
        aria-label="Mobile"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-3 text-base font-medium transition",
                      active
                        ? "bg-electric-500/10 text-brand-teal dark:text-electric-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                    )}
                  >
                    {t(item.label)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <AuthNavSlot stacked showInbox onNavigate={closeMobile} />
          </div>
        </div>
      </nav>
    </header>
  );
}
