"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchEngineerEscrowPayments } from "../api/payments.api";
import type { EscrowPaymentItem } from "../types";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

export function useEngineerEscrow() {
  const [payments, setPayments] = useState<EscrowPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayments(await fetchEngineerEscrowPayments());
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const inEscrow = payments
      .filter((p) => p.status === "In escrow")
      .reduce((s, p) => s + p.amountUsd, 0);
    const released = payments
      .filter((p) => p.status === "Released")
      .reduce((s, p) => s + p.amountUsd, 0);
    const pending = payments
      .filter((p) => p.status === "Pending")
      .reduce((s, p) => s + p.amountUsd, 0);
    return { inEscrow, released, pending, count: payments.length };
  }, [payments]);

  return { payments, stats, loading, error, refetch: load };
}
