"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAccount, updateAccount } from "../api/settings.api";
import type { Me } from "@/types";
import useAuthStore from "@/store/authStore";

export function useAccountSettings() {
  const setUser = useAuthStore((s) => s.setUser);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const account = await fetchAccount();
      setMe(account);
      setUser(account);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (payload: { name?: string; bio?: string; nationality?: string }) => {
      setSaving(true);
      setError(null);
      try {
        const updated = await updateAccount(payload);
        setMe(updated);
        setUser(updated);
        return updated;
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        setError(err?.response?.data?.message ?? err?.message ?? "Failed to save");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [setUser],
  );

  return { me, loading, saving, error, refetch, save };
}
