"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchActiveDisputes,
  fetchAdminAnalytics,
  fetchAdminStats,
  fetchEscrowOverview,
  fetchPendingVerifications,
  isReviewableVerification,
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

export function useAdmin(opts: { loadOverview: boolean; loadVerifications: boolean }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [escrow, setEscrow] = useState<EscrowOverview | null>(null);
  const [disputes, setDisputes] = useState<ActiveDispute[]>([]);
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [incompleteVerifications, setIncompleteVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(opts.loadOverview || opts.loadVerifications);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const applyVerifications = useCallback((v: PendingVerification[]) => {
    setVerifications((v ?? []).filter(isReviewableVerification));
    setIncompleteVerifications((v ?? []).filter((item) => !isReviewableVerification(item)));
  }, []);

  const loadOverview = useCallback(async () => {
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
      applyVerifications(v);
      setAnalytics(a);
      setEscrow(e);
      setDisputes(d);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyVerifications]);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      applyVerifications(await fetchPendingVerifications());
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyVerifications]);

  useEffect(() => {
    if (opts.loadOverview) {
      void loadOverview();
      return;
    }
    if (opts.loadVerifications) {
      void loadVerifications();
    }
  }, [opts.loadOverview, opts.loadVerifications, loadOverview, loadVerifications]);

  const approve = useCallback(
    async (profileId: number) => {
      setActionLoading(profileId);
      try {
        await updateVerification(profileId, "APPROVED");
        await loadVerifications();
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(null);
      }
    },
    [loadVerifications],
  );

  const reject = useCallback(
    async (profileId: number) => {
      setActionLoading(profileId);
      try {
        await updateVerification(profileId, "REJECTED");
        await loadVerifications();
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(null);
      }
    },
    [loadVerifications],
  );

  return {
    stats,
    analytics,
    escrow,
    disputes,
    verifications,
    incompleteVerifications,
    loading,
    error,
    actionLoading,
    refetch: opts.loadOverview ? loadOverview : loadVerifications,
    approve,
    reject,
  };
}
