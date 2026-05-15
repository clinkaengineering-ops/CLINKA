import { useEffect, useRef, useState } from "react";
import { useI18n, type Lang } from "../i18n";
import { IconGlobe } from "./Icons";
import { cn } from "../utils/cn";

const LANGS: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🇺🇸" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇸🇦" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find(l => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-electric-500/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm font-medium",
          compact ? "h-9 px-2.5" : "h-9 px-3"
        )}
        aria-label="Change language"
      >
        <IconGlobe width={16} height={16} className="text-electric-500" />
        <span className="hidden sm:inline">{current.flag}</span>
        <span className="font-semibold uppercase tracking-wider text-xs">{current.code}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-slate-400">
          <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            "absolute mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-fade-up",
            "ltr:right-0 rtl:left-0"
          )}
        >
          <div className="p-2">
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Language · اللغة</p>
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition",
                  l.code === lang
                    ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <span className="text-lg">{l.flag}</span>
                <div className="flex-1 text-start">
                  <p className="font-semibold leading-tight">{l.native}</p>
                  <p className="text-[11px] text-slate-500">{l.label}</p>
                </div>
                {l.code === lang && (
                  <span className="h-2 w-2 rounded-full bg-electric-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
