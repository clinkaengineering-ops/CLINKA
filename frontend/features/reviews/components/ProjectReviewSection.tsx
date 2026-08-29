"use client";

import { Badge, Card } from "@/components/UI";
import { IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useProjectReview } from "../hooks/useProjectReview";
import { ReviewForm } from "./ReviewForm";
import { StarRating } from "./StarRating";

export function ProjectReviewSection({
  projectId,
  projectTitle,
  engineerName,
  onSubmitted,
}: {
  projectId: number;
  projectTitle: string;
  engineerName?: string;
  onSubmitted?: () => void;
}) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role === "CLIENT";
  const { eligibility, review, loading, submitting, error, submitReview } =
    useProjectReview(projectId, isClient);

  if (!isClient) return null;

  if (loading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5 text-sm text-rose-500">{error}</Card>
    );
  }

  if (review || eligibility?.hasReview) {
    const r = review ?? eligibility?.review;
    if (!r) return null;
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm">{t("rv.yourReview")}</h3>
          <Badge color="green">{t("rv.submitted")}</Badge>
        </div>
        <div className="mt-3">
          <StarRating value={r.rating} readonly size={16} />
        </div>
        {r.comment && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {r.comment}
          </p>
        )}
      </Card>
    );
  }

  if (eligibility?.canReview) {
    return (
      <Card className="p-5 border-electric-500/30">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <IconStar width={16} height={16} className="text-amber-500" />
          {t("rv.writeReview")}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{t("rv.pendingDesc")}</p>
        <ReviewForm
          projectTitle={projectTitle}
          engineerName={engineerName ?? t("rv.theEngineer")}
          loading={submitting}
          onSubmit={async (rating, comment) => {
            await submitReview({ rating, comment });
            onSubmitted?.();
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-slate-50 dark:bg-slate-900/40">
      <p className="text-sm text-slate-500">{t("rv.notYetEligible")}</p>
    </Card>
  );
}
