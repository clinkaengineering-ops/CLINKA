"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/UI";
import { IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { PendingReviewProject } from "../types";
import { ReviewForm } from "./ReviewForm";

export function PendingReviewsPanel({
  items,
  submitting,
  onSubmit,
}: {
  items: PendingReviewProject[];
  submitting: boolean;
  onSubmit: (
    projectId: number,
    rating: number,
    comment: string,
  ) => Promise<void>;
}) {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<number | null>(
    items[0]?.projectId ?? null,
  );

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-500 text-sm">
        {t("rv.noPending")}
      </Card>
    );
  }

  const active = items.find((i) => i.projectId === activeId) ?? items[0];

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold">{t("rv.pendingTitle")}</h2>
          <p className="text-xs text-slate-500 mt-1">{t("rv.pendingDesc")}</p>
        </div>
        <div className="p-5 space-y-3">
          {items.map((item) => (
            <button
              key={item.projectId}
              type="button"
              onClick={() => setActiveId(item.projectId)}
              className={`w-full text-start rounded-xl border p-4 transition ${
                active?.projectId === item.projectId
                  ? "border-electric-500 bg-electric-500/5"
                  : "border-slate-200 dark:border-slate-800 hover:border-electric-500/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="font-semibold text-sm">{item.projectTitle}</p>
                <Badge color="amber">{t("rv.awaiting")}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{item.engineerName}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <IconStar width={18} height={18} className="text-amber-500" />
          <h3 className="font-bold">{t("rv.writeReview")}</h3>
        </div>
        {active && (
          <ReviewForm
            projectTitle={active.projectTitle}
            engineerName={active.engineerName}
            loading={submitting}
            onSubmit={(rating, comment) =>
              onSubmit(active.projectId, rating, comment)
            }
          />
        )}
      </Card>
    </div>
  );
}
