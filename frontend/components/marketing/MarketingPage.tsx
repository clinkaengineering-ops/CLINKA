"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/UI";
import { IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";

export function MarketingPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight break-words">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <Link href="/projects" className="inline-block">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconArrow width={16} height={16} />}
          >
            {t("legal.nav.exploreProjects")}
          </Button>
        </Link>
      </div>

      <Card className="mt-8 p-6 sm:p-8 prose prose-slate dark:prose-invert max-w-none">
        {children}
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/about">
          <Button variant="ghost" size="sm">
            {t("foot.about")}
          </Button>
        </Link>
        <Link href="/privacy">
          <Button variant="ghost" size="sm">
            {t("foot.privacy")}
          </Button>
        </Link>
        <Link href="/terms">
          <Button variant="ghost" size="sm">
            {t("foot.terms")}
          </Button>
        </Link>
        <Link href="/security">
          <Button variant="ghost" size="sm">
            {t("foot.security")}
          </Button>
        </Link>
        <Link href="/help">
          <Button variant="ghost" size="sm">
            {t("foot.help")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

