"use client";

import { useEffect, useState } from "react";
import { fetchLandingSnapshot } from "../api/landing.api";
import type { LandingSnapshot } from "../types";

export function useLandingData() {
  const [data, setData] = useState<LandingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLandingSnapshot()
      .then((snapshot) => {
        if (!cancelled) setData(snapshot);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const err = e as { message?: string };
          setError(err?.message ?? "Failed to load platform stats");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
