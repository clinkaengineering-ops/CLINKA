import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Avatar, Badge, Button } from "./UI";
import {
  IconHome, IconUsers, IconBriefcase, IconChart, IconWallet, IconMessage,
  IconShield, IconSettings, IconBell, IconSearch, IconLogo, IconMenu, IconClose,
  IconSun, IconMoon, IconLogout, IconUser
} from "./Icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "../i18n";

export type PageKey =
  | "landing" | "engineers" | "projects" | "profile" | "client" | "engineerDash"
  | "admin" | "escrow" | "messages" | "auth" | "verification" | "settings";

const navDef: { key: PageKey; labelKey: string; icon: any; sectionKey: string; badge?: string }[] = [
  { key: "landing", labelKey: "side.home", icon: IconHome, sectionKey: "side.discover" },
  { key: "engineers", labelKey: "side.findEngineers", icon: IconUsers, sectionKey: "side.discover" },
  { key: "projects", labelKey: "side.findProjects", icon: IconBriefcase, sectionKey: "side.discover" },
  { key: "profile", labelKey: "side.engineerProfile", icon: IconUser, sectionKey: "side.discover" },

  { key: "client", labelKey: "side.clientDash", icon: IconChart, sectionKey: "side.workspace" },
  { key: "engineerDash", labelKey: "side.engineerDash", icon: IconChart, sectionKey: "side.workspace" },
  { key: "messages", labelKey: "side.messages", icon: IconMessage, sectionKey: "side.workspace", badge: "3" },
  { key: "escrow", labelKey: "side.escrow", icon: IconWallet, sectionKey: "side.workspace" },

  { key: "admin", labelKey: "side.admin", icon: IconShield, sectionKey: "side.operations" },
  { key: "verification", labelKey: "side.verification", icon: IconShield, sectionKey: "side.operations" },
  { key: "settings", labelKey: "side.settings", icon: IconSettings, sectionKey: "side.operations" },
  { key: "auth", labelKey: "side.signin", icon: IconLogout, sectionKey: "side.operations" },
];

export function AppShell({
  page, setPage, dark, setDark, children,
}: {
  page: PageKey;
  setPage: (p: PageKey) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const isLanding = page === "landing" || page === "auth";

  const sectionsOrder = ["side.discover", "side.workspace", "side.operations"];

  // Landing & Auth render in full-bleed mode without the sidebar
  if (isLanding) {
    return (
      <div className={dark ? "dark" : ""}>
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <TopNav page={page} setPage={setPage} dark={dark} setDark={setDark} marketing />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <IconMenu />
          </button>
          <Brand onClick={() => setPage("landing")} />
          <div className="flex items-center gap-1">
            <LanguageSwitcher compact />
            <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              {dark ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className={cn(
            "fixed lg:sticky inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex flex-col transition-transform lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            "h-screen top-0"
          )}>
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-900">
              <Brand onClick={() => { setPage("landing"); setMobileOpen(false); }} />
              <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <IconClose />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {sectionsOrder.map(section => (
                <div key={section}>
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{t(section)}</p>
                  <div className="space-y-0.5">
                    {navDef.filter(n => n.sectionKey === section).map(item => {
                      const Icon = item.icon;
                      const active = page === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => { setPage(item.key); setMobileOpen(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition group",
                            active
                              ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 ring-1 ring-electric-500/30"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                        >
                          <Icon width={18} height={18} />
                          <span className="flex-1 text-start">{t(item.labelKey)}</span>
                          {item.badge && <Badge color="electric">{item.badge}</Badge>}
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="m-3 p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-navy-800 dark:from-electric-600/20 dark:to-navy-900 text-white relative overflow-hidden">
              <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-electric-500/20 blur-2xl" />
              <p className="text-xs font-semibold uppercase tracking-wider text-electric-300">{t("side.proTitle")}</p>
              <p className="mt-1 text-sm font-semibold">{t("side.proDesc")}</p>
              <Button size="sm" className="mt-3 w-full">{t("side.upgrade")}</Button>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-900 p-3 flex items-center gap-3">
              <Avatar name="Layla Hassan" size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Layla Hassan</p>
                <p className="text-xs text-slate-500 truncate">{t("side.userRole")}</p>
              </div>
              <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                {dark ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
              </button>
            </div>
          </aside>

          {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}

          {/* Main */}
          <main className="flex-1 min-w-0">
            <DashTopBar />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  const { t } = useI18n();
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 group">
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-electric-400 to-navy-700 flex items-center justify-center text-white shadow-lg shadow-electric-500/30 group-hover:scale-105 transition">
        <IconLogo width={20} height={20} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
      </div>
      <div className="text-start leading-tight">
        <p className="text-base font-bold tracking-tight">CLINKA</p>
        <p className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">{t("brand.tagline")}</p>
      </div>
    </button>
  );
}

function DashTopBar() {
  const { t } = useI18n();
  return (
    <div className="hidden lg:flex sticky top-0 z-30 items-center gap-4 h-16 px-6 lg:px-8 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900">
      <div className="relative max-w-md flex-1">
        <IconSearch width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder={t("side.searchPlaceholder")} className="w-full h-10 ps-10 pe-20 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
        <kbd className="absolute end-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">⌘K</kbd>
      </div>
      <div className="ms-auto flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="sm">{t("side.newProject")}</Button>
        <button className="relative h-10 w-10 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center">
          <IconBell width={18} height={18} />
          <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
        </button>
        <Avatar name="Layla Hassan" size={36} />
      </div>
    </div>
  );
}

function TopNav({ page, setPage, dark, setDark, marketing }: { page: PageKey; setPage: (p: PageKey) => void; dark: boolean; setDark: (v: boolean) => void; marketing?: boolean }) {
  const { t } = useI18n();
  const links: { label: string; key: PageKey }[] = [
    { label: t("nav.marketplace"), key: "engineers" },
    { label: t("nav.projects"), key: "projects" },
    { label: t("nav.profile"), key: "profile" },
    { label: t("nav.dashboards"), key: "client" },
    { label: t("nav.escrow"), key: "escrow" },
    { label: t("nav.admin"), key: "admin" },
  ];
  return (
    <header className={cn("sticky top-0 z-40 backdrop-blur-xl border-b", marketing ? "bg-white/70 dark:bg-slate-950/70 border-slate-200/60 dark:border-slate-900" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900")}>
      <div className="max-w-7xl mx-auto flex items-center gap-6 px-6 h-16">
        <Brand onClick={() => setPage("landing")} />
        <nav className="hidden md:flex items-center gap-1 ml-4">
          {links.map(l => (
            <button key={l.key} onClick={() => setPage(l.key)} className={cn("px-3 h-9 rounded-lg text-sm font-medium transition", page === l.key ? "text-electric-600 dark:text-electric-400 bg-electric-500/10" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900")}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={() => setDark(!dark)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            {dark ? <IconSun width={18} height={18} /> : <IconMoon width={18} height={18} />}
          </button>
          <Button variant="ghost" size="sm" onClick={() => setPage("auth")}>{t("nav.signin")}</Button>
          <Button size="sm" onClick={() => setPage("auth")}>{t("nav.getStarted")}</Button>
        </div>
      </div>
    </header>
  );
}
