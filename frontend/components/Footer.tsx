"use client";

import Link from "next/link";
import { BrandLink } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";

const footerLinkMap: Record<string, string> = {
  "side.findEngineers": "/engineers",
  "side.findProjects": "/projects",
  "foot.about": "/about",
  "foot.security": "/security",
  "foot.privacy": "/privacy",
  "foot.terms": "/terms",
  "foot.help": "/help",
};

const footerColumns = [
  {
    title: "foot.platform",
    items: ["side.findEngineers", "side.findProjects"],
  },
  {
    title: "foot.company",
    items: ["foot.about", "foot.security", "foot.privacy", "foot.terms"],
  },
  {
    title: "foot.support",
    items: ["foot.help"],
  },
];

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <div className="space-y-4">
            <BrandLink logoClassName="h-9 w-auto max-w-[180px] sm:h-10" />
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {t("foot.tagline")}
            </p>
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t(column.title)}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              {column.items.map((item) => (
                <li key={item}>
                  <Link
                    href={footerLinkMap[item] ?? "/"}
                    className="inline-block py-0.5 transition hover:text-brand-copper"
                  >
                    {t(item)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-900 py-6 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-7xl">
          <p className="break-words">{t("foot.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
