// features/users/hooks/useEngineerById.ts
"use client";
import { useState, useEffect } from "react";
import { getEngineerById } from "@/features/engineers/api/engineer.api";
import type { EngineerDetail } from "@/types";

export function useEngineerById(id: number) {
  const [engineer, setEngineer] = useState<EngineerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEngineerById(id)
      .then(setEngineer)
      .catch((e: any) =>
        setError(e?.response?.data?.message ?? e?.message ?? "Engineer not found")
      )
      .finally(() => setLoading(false));
  }, [id]);

  return { engineer, loading, error };
}
