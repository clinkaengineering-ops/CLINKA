// features/users/hooks/useEngineers.ts
"use client";
import { useState, useEffect } from "react";
import { getEngineers } from "@/features/users/api/user.api";
import type { Engineer } from "@/types";

export function useEngineers() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEngineers()
      .then(setEngineers)
      .catch((e: any) =>
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch engineers")
      )
      .finally(() => setLoading(false));
  }, []);

  return { engineers, loading, error };
}
