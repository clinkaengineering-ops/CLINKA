"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchEngineerBalance } from "../api/payments.api";
import type { EngineerBalanceSummary } from "../types";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

const emptyBalance: EngineerBalanceSummary = {
  availableBalance: 0,
  pendingBalance: 0,
  securedBalance: 0,
  awaitingClientPayment: 0,
  transactions: [],
  withdrawalRequests: [],
};

export function useEngineerBalance() {
  const [balance, setBalance] = useState<EngineerBalanceSummary>(emptyBalance);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBalance(await fetchEngineerBalance());
    } catch (err) {
      setError(axiosMessage(err));
      setBalance(emptyBalance);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { balance, loading, error, refetch: load };
}
