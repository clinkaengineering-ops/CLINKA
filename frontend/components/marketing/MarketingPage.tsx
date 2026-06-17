"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/UI";
import { IconArrow } from "@/components/Icons";

export function MarketingPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
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
            Explore projects
          </Button>
        </Link>
      </div>

      <Card className="mt-8 p-6 sm:p-8 prose prose-slate dark:prose-invert max-w-none">
        {children}
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/about">
          <Button variant="ghost" size="sm">
            About
          </Button>
        </Link>
        <Link href="/privacy">
          <Button variant="ghost" size="sm">
            Privacy
          </Button>
        </Link>
        <Link href="/terms">
          <Button variant="ghost" size="sm">
            Terms
          </Button>
        </Link>
        <Link href="/security">
          <Button variant="ghost" size="sm">
            Security
          </Button>
        </Link>
        <Link href="/status">
          <Button variant="ghost" size="sm">
            Status
          </Button>
        </Link>
      </div>
    </div>
  );
}

