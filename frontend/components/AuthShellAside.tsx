"use client";

import { BrandLink } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";

const SHELL_FEATURES = [
  "auth.shell.f1",
  "auth.shell.f2",
  "auth.shell.f3",
  "auth.shell.f4",
] as const;

export function AuthShellAside() {
  const { t } = useI18n();

  return (
    <div className="hidden lg:flex relative overflow-hidden border-s border-slate-200/80 bg-gradient-to-br from-brand-ice via-white to-brand-copper/10 text-slate-900 dark:border-slate-800 dark:from-slate-950 dark:via-brand-teal/20 dark:to-brand-copper/10 dark:text-white">
      <div className="absolute inset-0 grid-bg opacity-50 dark:opacity-40" />
      <div className="absolute -bottom-40 -inset-e-40 h-150 w-150 bg-brand-teal/20 dark:bg-brand-teal/30 blur-[120px] rounded-full" />
      <div className="relative flex flex-col justify-between p-12 w-full">
        <div>
          <BrandLink variant="stacked" logoClassName="w-52 sm:w-64 mb-8" />
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/40 bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal dark:border-electric-400/30 dark:bg-electric-500/10 dark:text-electric-300">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-teal dark:bg-electric-400 animate-pulse" />
            {t("auth.shell.livePlatform")}
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-tight text-slate-900 dark:text-white">
            {t("auth.shell.connectTitle")}
          </h2>
          <p className="mt-4 text-slate-600 dark:text-white/70">{t("auth.shell.connectSub")}</p>
        </div>

        <div className="space-y-3">
          {SHELL_FEATURES.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-white/5"
            >
              <span className="h-7 w-7 rounded-lg bg-brand-teal/15 text-brand-teal dark:bg-electric-500/30 dark:text-electric-300 flex items-center justify-center">
                ✓
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-100">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
