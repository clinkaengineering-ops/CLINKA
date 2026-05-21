"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMyBids, type MyBid } from "../api/bids.api";

export function useMyBids() {
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBids(await fetchMyBids());
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to load bids");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeContracts = bids.filter(
    (b) =>
      b.status === "ACCEPTED" &&
      (b.project.status === "IN_PROGRESS" || b.project.status === "COMPLETED"),
  );

  return { bids, activeContracts, loading, error, refetch: load };
}
