"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMyReviews,
  fetchPendingReviews,
  submitProjectReview,
} from "../api/reviews.api";
import type { CreateReviewPayload, PendingReviewProject, Review } from "../types";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function useReviews() {
  const [pending, setPending] = useState<PendingReviewProject[]>([]);
  const [mine, setMine] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, mineData] = await Promise.all([
        fetchPendingReviews(),
        fetchMyReviews(),
      ]);
      setPending(pendingData);
      setMine(mineData);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitReview = useCallback(
    async (projectId: number, payload: CreateReviewPayload) => {
      setSubmitting(true);
      try {
        await submitProjectReview(projectId, payload);
        await load();
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  return {
    pending,
    mine,
    loading,
    error,
    submitting,
    refetch: load,
    submitReview,
  };
}
