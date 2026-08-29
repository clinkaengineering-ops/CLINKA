"use client";

import Link from "next/link";
import { Card } from "@/components/UI";
import { IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Review } from "../types";

export function ReviewList({
  reviews,
  emptyMessage,
}: {
  reviews: Review[];
  emptyMessage: string;
}) {
  const { t } = useI18n();

  if (reviews.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500 text-sm">{emptyMessage}</Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <Card key={r.id} className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-sm">
                {r.project?.title ?? `${t("rv.project")} #${r.projectId}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {r.client?.name
                  ? `${t("rv.by")} ${r.client.name}`
                  : t("rv.anonymousClient")}
              </p>
            </div>
            <span className="text-xs text-slate-500">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-3 flex">
            {Array.from({ length: r.rating }).map((_, k) => (
              <IconStar
                key={k}
                width={14}
                height={14}
                className="text-amber-500 fill-amber-500"
              />
            ))}
          </div>
          {r.comment && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {r.comment}
            </p>
          )}
          <Link
            href={`/projects?id=${r.projectId}`}
            className="inline-block mt-3 text-xs font-semibold text-electric-600 hover:underline"
          >
            {t("rv.viewProject")} →
          </Link>
        </Card>
      ))}
    </div>
  );
}
