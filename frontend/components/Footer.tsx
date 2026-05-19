"use client";

import Link from "next/link";
import { IconGlobe, IconLogo } from "@/components/Icons";
import { useI18n } from "@/i18n";

const footerColumns = [
  { title: "foot.platform", items: ["side.findEngineers", "side.findProjects", "nav.escrow", "side.verification"] },
  { title: "foot.company", items: ["foot.about", "foot.customers", "foot.careers", "foot.press"] },
  { title: "foot.resources", items: ["foot.help", "foot.blog", "foot.api", "foot.community"] },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-400 to-navy-700 text-white shadow-lg shadow-electric-500/20">
              <IconLogo width={20} height={20} />
            </div>
            <div>
              <p className="text-base font-bold">CLINKA</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("foot.tagline")}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <IconGlobe width={14} height={14} />
            <span>{t("foot.global")}</span>
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t(column.title)}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {column.items.map((item) => (
                <li key={item}>
                  <Link href="#" className="transition hover:text-electric-500">
                    {t(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-900 py-6 px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p>{t("foot.copyright")}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#" className="transition hover:text-electric-500">{t("foot.privacy")}</Link>
            <Link href="#" className="transition hover:text-electric-500">{t("foot.terms")}</Link>
            <Link href="#" className="transition hover:text-electric-500">{t("foot.security")}</Link>
            <Link href="#" className="transition hover:text-electric-500">{t("foot.status")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
