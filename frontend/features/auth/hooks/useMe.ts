// features/auth/hooks/useMe.ts
"use client";
import { useCallback, useState } from "react";
import { updateMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";
import type { Me } from "@/types";

export interface UseMeReturn {
  me: Me | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (payload: { name?: string; bio?: string }) => Promise<void>;
}

export function useMe(): UseMeReturn {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const [error, setError] = useState<string | null>(null);

  // refetch is kept for explicit refreshes (e.g. after profile update)
  const refetch = useCallback(async () => {
    const { getMe } = await import("@/features/engineers/api/engineer.api");
    try {
      setUser(await getMe());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load profile");
    }
  }, [setUser]);

  const update = useCallback(
    async (payload: { name?: string; bio?: string }) => {
      setUser(user ? { ...user, ...payload } as any : null); // optimistic
      try {
        const updated = await updateMe(payload);
        setUser(updated);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to update profile");
        refetch();
      }
    },
    [user, setUser, refetch],
  );

  return {
    me: user as Me | null,
    loading: !sessionReady,
    error,
    refetch,
    update,
  };
}