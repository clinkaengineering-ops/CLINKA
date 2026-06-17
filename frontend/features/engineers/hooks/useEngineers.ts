// features/users/hooks/useEngineers.ts
"use client";
import { useState, useEffect } from "react";
import { getEngineers } from "@/features/engineers/api/engineer.api";
import type { Engineer } from "@/types";

export function useEngineers(params?: { q?: string; specialty?: string; nationality?: string }) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const q = params?.q;
  const specialty = params?.specialty;
  const nationality = params?.nationality;

  useEffect(() => {
    setLoading(true);
    getEngineers({ q, specialty, nationality })
      .then(setEngineers)
      .catch((e: { response?: { data?: { message?: string } }; message?: string }) =>
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch engineers"),
      )
      .finally(() => setLoading(false));
  }, [q, specialty, nationality]);

  return { engineers, loading, error };
}