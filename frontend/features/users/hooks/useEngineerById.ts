"use client";
import { useState, useEffect } from "react";
import { userApi } from "../api/user.api";
import type { Engineer } from "@/types";

export function useEngineerById(id: number) {
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await userApi.getEngineerById(id);
        setEngineer(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Engineer not found");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  return { engineer, loading, error };
}
