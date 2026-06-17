"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminStats,
  fetchPendingVerifications,
  updateVerification,
  type AdminStats,
  type PendingVerification,
} from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function useAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, v] = await Promise.all([
        fetchAdminStats(),
        fetchPendingVerifications(),
      ]);
      setStats(s);
      setVerifications(v);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(
    async (profileId: number) => {
      setActionLoading(profileId);
      try {
        await updateVerification(profileId, "APPROVED");
        await load();
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(null);
      }
    },
    [load],
  );

  const reject = useCallback(
    async (profileId: number) => {
      setActionLoading(profileId);
      try {
        await updateVerification(profileId, "REJECTED");
        await load();
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(null);
      }
    },
    [load],
  );

  return {
    stats,
    verifications,
    loading,
    error,
    actionLoading,
    refetch: load,
    approve,
    reject,
  };
}
