"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  getEngineers,
  type EngineersListParams,
  type EngineersListResponse,
} from "@/features/engineers/api/engineer.api";
import type { Engineer } from "@/types";
import { ENGINEERS_PAGE_SIZE } from "@/utils/pagination";

const EMPTY_META: Omit<EngineersListResponse, "engineers"> = {
  totalCount: 0,
  page: 1,
  limit: ENGINEERS_PAGE_SIZE,
  totalPages: 0,
};

export function useEngineers(
  params?: Omit<EngineersListParams, "limit"> & { limit?: number },
) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = params?.q;
  const specialty = params?.specialty;
  const nationality = params?.nationality;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? ENGINEERS_PAGE_SIZE;
  const sortBy = params?.sortBy;
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setMeta((prev) => ({ ...prev, page, limit }));

    getEngineers(
      { q, specialty, nationality, page, limit, sortBy },
      { signal: controller.signal },
    )
      .then((result) => {
        if (id !== requestId.current) return;
        setEngineers(result.engineers);
        setMeta({
          totalCount: result.totalCount,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        });
      })
      .catch((e: { response?: { data?: { message?: string } }; message?: string; code?: string }) => {
        if (id !== requestId.current) return;
        if (axios.isCancel(e) || e?.code === "ERR_CANCELED") return;
        setEngineers([]);
        setMeta(EMPTY_META);
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to fetch engineers");
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [q, specialty, nationality, page, limit, sortBy]);

  return { engineers, meta, loading, error };
}
