"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/UI";
import { useI18n } from "@/i18n";
import { StarRating } from "./StarRating";

export function ReviewForm({
  projectTitle,
  engineerName,
  loading,
  onSubmit,
}: {
  projectTitle: string;
  engineerName: string;
  loading: boolean;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError(t("rv.ratingRequired"));
      return;
    }
    setError(null);
    try {
      await onSubmit(rating, comment.trim());
      setComment("");
      setRating(5);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold">{projectTitle}</p>
        <p className="text-xs text-slate-500">
          {t("rv.forEngineer")}: {engineerName}
        </p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          {t("rv.yourRating")}
        </p>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>
      <Textarea
        placeholder={t("rv.commentPlaceholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />
      {error && (
        <p className="text-sm text-rose-500" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? t("rv.submitting") : t("rv.submit")}
      </Button>
    </form>
  );
}
