// features/client/hooks/useClientDashboard.ts
// Dashboard-specific hooks only.
// User identity is handled by features/users/hooks/useMe — not here.
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardStats,
  fetchSpendOverview,
  fetchActiveProjects,
  fetchNotifications,
  fetchMessages,
  fetchEscrowItems,
  releaseMilestone,
  markNotificationRead,
} from "../api/client-dashboard.api";
import type {
  DashboardStats,
  SpendOverview,
  ClientProject,
  Notification,
  Message,
  EscrowItem,
} from "@/types";

// ── Generic async loader ──────────────────────────────────────────────────────
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}

// ── Dashboard stats ───────────────────────────────────────────────────────────
export function useDashboardStats() {
  return useAsync<DashboardStats>(fetchDashboardStats);
}

// ── Spend overview ────────────────────────────────────────────────────────────
export function useSpendOverview(period: "1M" | "6M" | "12M" | "all" = "12M") {
  return useAsync<SpendOverview>(() => fetchSpendOverview(period), [period]);
}

// ── Active projects ───────────────────────────────────────────────────────────
export function useActiveProjects() {
  return useAsync<ClientProject[]>(fetchActiveProjects);
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function useNotifications() {
  const state = useAsync<Notification[]>(fetchNotifications);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      state.refetch();
    },
    [state.refetch]
  );

  return { ...state, markRead };
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function useMessages(limit = 4) {
  return useAsync<Message[]>(() => fetchMessages(limit), [limit]);
}

// ── Escrow ────────────────────────────────────────────────────────────────────
export function useEscrowItems() {
  const state = useAsync<EscrowItem[]>(fetchEscrowItems);

  const release = useCallback(
    async (milestoneId: string) => {
      await releaseMilestone(milestoneId);
      state.refetch();
    },
    [state.refetch]
  );

  return { ...state, release };
}
