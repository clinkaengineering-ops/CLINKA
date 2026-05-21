"use client";

import Link from "next/link";
import { Button, Card, StatCard } from "@/components/UI";
import { IconStar, IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useMe } from "@/features/auth/hooks/useMe";
import { useReviews } from "../hooks/useReviews";
import type { Review } from "../types";
import { PendingReviewsPanel } from "./PendingReviewsPanel";
import { ReviewList } from "./ReviewList";

export function ReviewsPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { me } = useMe();
  const {
    pending,
    mine,
    loading,
    error,
    submitting,
    refetch,
    submitReview,
  } = useReviews();

  const isClient = user?.role === "CLIENT";

  async function handleSubmit(
    projectId: number,
    rating: number,
    comment: string,
  ) {
    await submitReview(projectId, { rating, comment: comment || undefined });
  }

  if (!isClient) {
    const received: Review[] = (me?.profile?.reviews ?? []) as Review[];
    const avg =
      received.length > 0
        ? (
            received.reduce((s: number, r: Review) => s + r.rating, 0) /
            received.length
          ).toFixed(1)
        : "—";
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("rv.title")}</h1>
          <p className="mt-1 text-slate-500">{t("rv.engineerReceived")}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label={t("rv.avgRating")} value={avg} icon={<IconStar width={20} height={20} />} />
          <StatCard
            label={t("rv.totalReviews")}
            value={String(received.length)}
            icon={<IconCheck width={20} height={20} />}
          />
        </div>
        {received.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">{t("rv.noReviewsYet")}</Card>
        ) : (
          <ReviewList reviews={received} emptyMessage={t("rv.noReviewsYet")} />
        )}
      </div>
    );
  }

  const avgGiven =
    mine.length > 0
      ? (mine.reduce((s, r) => s + r.rating, 0) / mine.length).toFixed(1)
      : "—";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("rv.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {t("rv.subtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex justify-between items-center gap-3">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          {t("common.loading")}
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              label={t("rv.statPending")}
              value={String(pending.length)}
              icon={<IconStar width={20} height={20} />}
            />
            <StatCard
              label={t("rv.statSubmitted")}
              value={String(mine.length)}
              icon={<IconCheck width={20} height={20} />}
            />
            <StatCard
              label={t("rv.statAvgGiven")}
              value={avgGiven}
              icon={<IconStar width={20} height={20} />}
            />
          </div>

          <PendingReviewsPanel
            items={pending}
            submitting={submitting}
            onSubmit={handleSubmit}
          />

          <div>
            <h2 className="text-lg font-bold mb-4">{t("rv.historyTitle")}</h2>
            <ReviewList reviews={mine} emptyMessage={t("rv.noHistory")} />
          </div>
        </>
      )}
    </div>
  );
}
