"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import type { ClientProject } from "@/types";

export function DashboardActiveProjects({
  projects,
  loading,
}: {
  projects: ClientProject[];
  loading: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold">{t("cd.activeProjects")}</h2>
        <Link href="/my-projects">
          <Button size="sm" variant="ghost">
            {t("common.viewAll")}
          </Button>
        </Link>
      </div>
      {loading ? (
        <p className="p-8 text-sm text-slate-500">{t("common.loading")}</p>
      ) : projects.length === 0 ? (
        <p className="p-8 text-sm text-slate-500 text-center">{t("cd.noProjects")}</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {projects.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              href={`/projects?id=${p.id}`}
              className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{p.title}</p>
                <Badge color="electric">{p.discipline}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {p.engineerName} · {p.escrowAmount}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
