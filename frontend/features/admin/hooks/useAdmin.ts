"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchActiveDisputes,
  fetchAdminAnalytics,
  fetchAdminStats,
  fetchEscrowOverview,
  fetchPendingVerifications,
  updateVerification,
  type ActiveDispute,
  type AdminStats,
  type AnalyticsData,
  type EscrowOverview,
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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [escrow, setEscrow] = useState<EscrowOverview | null>(null);
  const [disputes, setDisputes] = useState<ActiveDispute[]>([]);
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, v, a, e, d] = await Promise.all([
        fetchAdminStats(),
        fetchPendingVerifications(),
        fetchAdminAnalytics(),
        fetchEscrowOverview(),
        fetchActiveDisputes(6),
      ]);
      setStats(s);
      setVerifications(v);
      setAnalytics(a);
      setEscrow(e);
      setDisputes(d);
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
    analytics,
    escrow,
    disputes,
    verifications,
    loading,
    error,
    actionLoading,
    refetch: load,
    approve,
    reject,
  };
}
