"use client";
import { useState, useEffect } from "react";
import { userApi } from "../api/user.api";
import type { Engineer } from "@/types";

export function useEngineers() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await userApi.getEngineers();
        setEngineers(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch engineers");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { engineers, loading, error };
}
