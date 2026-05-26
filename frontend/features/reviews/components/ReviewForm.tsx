"use client";

import { useState } from "react";
import { Button, Field, Textarea } from "@/components/UI";
import { useI18n } from "@/i18n";
import {
  createReviewFormSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = validateForm(createReviewFormSchema, {
      rating,
      comment: comment.trim() || undefined,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setFormError(null);
    try {
      await onSubmit(result.data.rating, result.data.comment ?? "");
      setComment("");
      setRating(5);
    } catch (err) {
      setFormError((err as Error).message);
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
        {fieldErrors.rating && (
          <p className="mt-1 text-xs text-rose-500">{fieldErrors.rating}</p>
        )}
      </div>
      <Field label="Comment (optional)" error={fieldErrors.comment}>
        <Textarea
          placeholder={t("rv.commentPlaceholder")}
          value={comment}
          error={!!fieldErrors.comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </Field>
      {(formError || fieldErrors._form) && (
        <p className="text-sm text-rose-500" role="alert">
          {formError ?? fieldErrors._form}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? t("rv.submitting") : t("rv.submit")}
      </Button>
    </form>
  );
}
