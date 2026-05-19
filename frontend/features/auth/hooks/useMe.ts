// features/users/hooks/useMe.ts
// THE one and only useMe hook for the entire application.
// Any component that needs the current user imports from here.
"use client";
import { useState, useEffect, useCallback } from "react";
import { getMe, updateMe } from "@/features/engineers/api/engineer.api";
import type { Me } from "@/types";

export interface UseMeReturn {
  me: Me | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (payload: { name?: string; bio?: string }) => Promise<void>;
}

export function useMe(): UseMeReturn {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMe(await getMe());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(
    async (payload: { name?: string; bio?: string }) => {
      // Optimistic update so the UI feels instant
      setMe((prev) => (prev ? { ...prev, ...payload } : prev));
      try {
        const updated = await updateMe(payload);
        setMe(updated); // replace with the real server response (includes profile)
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to update profile");
        refetch(); // roll back to server state on error
      }
    },
    [refetch]
  );

  return { me, loading, error, refetch, update };
}
