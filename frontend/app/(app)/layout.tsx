"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavbarActions } from "@/components/NavbarActions";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/utils/cn";
import {
  IconHome, IconUsers, IconBriefcase, IconChart, IconWallet, IconMessage, IconStar,
  IconShield, IconSettings, IconMenu, IconClose,
  IconLogout,
} from "@/components/Icons";
import { BrandLink } from "@/components/BrandLogo";
import { Avatar, Button } from "@/components/UI";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { featureFlags } from "@/lib/featureFlags";
import { ProUpgradeCard } from "@/features/upgrade/components/ProUpgradeCard";

const navItems = [
  // Discover
  { href: "/", label: "side.home", icon: IconHome, section: "side.discover" },
  { href: "/engineers", label: "side.findEngineers", icon: IconUsers, section: "side.discover" },
  { href: "/projects", label: "side.findProjects", icon: IconBriefcase, section: "side.discover" },
  { href: "/my-bids", label: "side.myBids", icon: IconBriefcase, section: "side.workspace" },

  // Workspace
  { href: "/dashboard", label: "side.clientDash", icon: IconChart, section: "side.workspace" },
  { href: "/messages", label: "side.messages", icon: IconMessage, section: "side.workspace" },
  { href: "/balance", label: "side.balance", icon: IconWallet, section: "side.workspace", roles: ["ENGINEER"] as const },
  { href: "/reviews", label: "side.reviews", icon: IconStar, section: "side.workspace" },

  // Operations
  { href: "/admin", label: "side.admin", icon: IconShield, section: "side.operations" },
  { href: "/settings", label: "side.settings", icon: IconSettings, section: "side.operations" },
];

const sections = ["side.discover", "side.workspace", "side.operations"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>{children}</AppShell>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, sessionReady, logout } = useAuthStore();
  const displayName = sessionReady ? (user?.name ?? t("common.guest")) : "…";
  const displayRole = sessionReady ? (user?.role ?? "") : "";

  const visibleNavItems = useMemo(() => {
    if (user?.role === "ADMIN") {
      return [
        { href: "/", label: "side.home", icon: IconHome, section: "side.discover" },
        { href: "/engineers", label: "side.findEngineers", icon: IconUsers, section: "side.discover" },
        { href: "/projects", label: "side.findProjects", icon: IconBriefcase, section: "side.discover" },
        { href: "/admin", label: "side.admin", icon: IconShield, section: "side.workspace" },
        { href: "/settings", label: "side.settings", icon: IconSettings, section: "side.operations" },
      ];
    }

    return navItems.filter((item) => {
      if (item.href === "/admin") return false;
      if (item.href === "/reviews" && user?.role !== "CLIENT") return false;
      if (item.href === "/balance" && user?.role !== "ENGINEER") return false;
      const roleScope = (item as { roles?: readonly string[] }).roles;
      if (roleScope && user?.role && !roleScope.includes(user.role)) {
        return false;
      }
      if (item.href === "/my-bids" && user?.role !== "ENGINEER") return false;
      return true;
    });
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleNewProject() {
    if (!user) {
      router.push("/login?next=/projects?create=1");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (user.role === "CLIENT") {
      router.push("/projects?create=1");
      return;
    }
    router.push("/projects");
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-ice dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 px-4 h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="p-2.5 min-h-11 min-w-11 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 transition-smooth">
            <IconMenu />
          </button>
          <Brand />
          <div className="flex items-center gap-1">
            <LangToggle compact />
            <ThemeToggle compact />
          </div>
        </div>

        <div className="flex">
          {/* Sidebar — fixed on desktop so main content scrolls independently */}
          <aside className={cn(
            "fixed inset-y-0 start-0 z-50 w-72 bg-white dark:bg-slate-950 border-e border-slate-200 dark:border-slate-900 flex flex-col transition-transform h-screen motion-safe:duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
          )}>
            {/* Logo */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-900">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <IconClose />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {sections.map(section => (
                <div key={section}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    {t(section)}
                  </p>
                  <div className="space-y-0.5">
                    {visibleNavItems.filter(n => n.section === section).map(item => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 min-h-11 rounded-lg text-sm font-medium transition-smooth group",
                            active
                              ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 ring-1 ring-electric-500/30"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                        >
                          <Icon width={18} height={18} />
                          <span className="flex-1 text-start">{t(item.label)}</span>
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {featureFlags.proUpgrade && <ProUpgradeCard />}

            {/* User footer */}
            <div className="border-t border-slate-200 dark:border-slate-900 p-3 flex items-center gap-3">
              <Avatar
                name={displayName}
                src={user?.avatarUrl ?? undefined}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{displayRole}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition"
              >
                <IconLogout width={16} height={16} />
              </button>
            </div>
          </aside>

          {mobileOpen && (
            <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
          )}

          {/* Main content — offset by sidebar width on desktop */}
          <main className="flex-1 min-w-0 lg:ms-72">
            {/* Top bar */}
            <div className="hidden lg:flex sticky top-0 z-30 items-center justify-between gap-2 h-16 px-6 lg:px-8 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900">
              <BrandLink logoClassName="h-11 w-auto max-w-[220px]" priority />
              <div className="flex items-center gap-2">
                {user?.role === "CLIENT" && (
                  <Button variant="ghost" size="sm" onClick={handleNewProject}>
                    {t("side.newProject")}
                  </Button>
                )}
                <LangToggle compact />
                <ThemeToggle compact />
                {user && <NavbarActions showInbox={false} />}
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
    </div>
  );
}

function Brand() {
  return <BrandLink logoClassName="h-12 w-auto max-w-[260px] sm:h-14 sm:max-w-[300px]" priority />;
}