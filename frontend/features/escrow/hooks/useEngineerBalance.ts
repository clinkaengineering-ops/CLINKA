"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { fetchEngineerBalance } from "../api/payments.api";
import type { EngineerBalanceSummary } from "../types";

const emptyBalance: EngineerBalanceSummary = {
  availableBalance: 0,
  spendableBalance: 0,
  heldInWithdrawals: 0,
  pendingBalance: 0,
  securedBalance: 0,
  awaitingClientPayment: 0,
  heldByDispute: 0,
  transactions: [],
  walletHistory: [],
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
      setError(getApiErrorMessage(err, "Request failed"));
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
