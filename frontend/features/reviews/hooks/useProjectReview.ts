"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchProjectReview,
  fetchReviewEligibility,
  submitProjectReview,
} from "../api/reviews.api";
import type { CreateReviewPayload, Review, ReviewEligibility } from "../types";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function useProjectReview(projectId: number | null, enabled: boolean) {
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null,
  );
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const elig = await fetchReviewEligibility(projectId);
      setEligibility(elig);
      if (elig.hasReview) {
        try {
          const r = await fetchProjectReview(projectId);
          setReview(r);
        } catch {
          setReview(elig.review as Review | null);
        }
      } else {
        setReview(null);
      }
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(
    async (payload: CreateReviewPayload) => {
      if (!projectId) return;
      setSubmitting(true);
      try {
        const created = await submitProjectReview(projectId, payload);
        setReview(created);
        setEligibility({ canReview: false, hasReview: true, review: created });
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [projectId],
  );

  return {
    eligibility,
    review,
    loading,
    submitting,
    error,
    refetch: load,
    submitReview: submit,
  };
}
