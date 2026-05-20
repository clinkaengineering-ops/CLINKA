"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { cn } from "@/utils/cn";
import {
  IconHome, IconUsers, IconBriefcase, IconChart, IconWallet, IconMessage,
  IconShield, IconSettings, IconBell, IconSearch, IconLogo, IconMenu, IconClose,
  IconSun, IconMoon, IconLogout, IconUser
} from "@/components/Icons";
import { Avatar, Badge, Button } from "@/components/UI";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";

const navItems = [
  // Discover
  { href: "/", label: "side.home", icon: IconHome, section: "side.discover" },
  { href: "/engineers", label: "side.findEngineers", icon: IconUsers, section: "side.discover" },
  { href: "/projects", label: "side.findProjects", icon: IconBriefcase, section: "side.discover" },

  // Workspace
  { href: "/dashboard", label: "side.clientDash", icon: IconChart, section: "side.workspace" },
  { href: "/messages", label: "side.messages", icon: IconMessage, section: "side.workspace" },
  { href: "/escrow", label: "side.escrow", icon: IconWallet, section: "side.workspace" },

  // Operations
  { href: "/admin", label: "side.admin", icon: IconShield, section: "side.operations" },
  { href: "/settings", label: "side.settings", icon: IconSettings, section: "side.operations" },
];

const sections = ["side.discover", "side.workspace", "side.operations"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleNewProject() {
    if (!user) {
      router.push("/login?next=/projects?create=1");
      return;
    }
    if (user.role === "CLIENT") {
      router.push("/projects?create=1");
      return;
    }
    router.push("/projects");
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <IconMenu />
          </button>
          <Brand />
          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className={cn(
            "fixed lg:sticky inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex flex-col transition-transform lg:translate-x-0 h-screen top-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
                    {navItems.filter(n => n.section === section).map(item => {
                      const Icon = item.icon;
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition group",
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

            {/* Pro upgrade card */}
            <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 dark:from-electric-600/20 dark:to-navy-900 text-white relative overflow-hidden">
              <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-electric-500/20 blur-2xl" />
              <p className="text-xs font-semibold uppercase tracking-wider text-electric-300">{t("side.proTitle")}</p>
              <p className="mt-1 text-sm font-semibold">{t("side.proDesc")}</p>
              <Button size="sm" className="mt-3 w-full">{t("side.upgrade")}</Button>
            </div>

            {/* User footer */}
            <div className="border-t border-slate-200 dark:border-slate-900 p-3 flex items-center gap-3">
              <Avatar name={user?.name ?? "User"} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name ?? "Guest"}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role ?? ""}</p>
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

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="hidden lg:flex sticky top-0 z-30 items-center gap-4 h-16 px-6 lg:px-8 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900">
              <div className="relative max-w-md flex-1">
                <IconSearch width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder={t("side.searchPlaceholder")}
                  className="w-full h-10 ps-10 pe-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                />
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleNewProject}>
                  {t("side.newProject")}
                </Button>
                <button className="relative h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center">
                  <IconBell width={18} height={18} />
                  <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
                </button>
                <button
                  onClick={() => setDark(!dark)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {dark ? <IconSun width={18} height={18} /> : <IconMoon width={18} height={18} />}
                </button>
                <Avatar name={user?.name ?? "User"} size={36} />
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>

    </div>
  );
}

function Brand() {
  const { t } = useI18n();
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-electric-400 to-navy-700 flex items-center justify-center text-white shadow-lg shadow-electric-500/30 group-hover:scale-105 transition">
        <IconLogo width={20} height={20} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </div>
      <div className="text-start leading-tight">
        <p className="text-base font-bold tracking-tight">CLINKA</p>
        <p className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">{t("brand.tagline")}</p>
      </div>
    </Link>
  );
}