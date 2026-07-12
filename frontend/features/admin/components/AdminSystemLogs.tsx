"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge } from "@/components/UI";
import { cn } from "@/utils/cn";
import { fetchSystemLogs, type SystemLog } from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function getLevelColor(level: string) {
  switch (level) {
    case "ERROR":
      return "rose";
    case "WARN":
      return "amber";
    case "INFO":
      return "blue";
    case "DEBUG":
      return "slate";
    default:
      return "slate";
  }
}

export function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARN" | "INFO">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSystemLogs();
      setLogs(data);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filteredLogs = filter === "ALL" ? logs : logs.filter((log) => log.level === filter);

  const counts = useMemo(
    () => ({
      INFO: logs.filter((l) => l.level === "INFO").length,
      WARN: logs.filter((l) => l.level === "WARN").length,
      ERROR: logs.filter((l) => l.level === "ERROR").length,
    }),
    [logs],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">System logs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Live events from registrations, payments, bans, tickets, and projects. Auto-refreshes every 30s.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {(["INFO", "WARN", "ERROR"] as const).map((level) => (
          <Card key={level} className="p-3 text-center">
            <p className="text-xs uppercase tracking-wider text-slate-500">{level}</p>
            <p className="text-2xl font-bold mt-1">{counts[level]}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        {error && (
          <p className="p-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">
            {error}
          </p>
        )}

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2 items-center flex-wrap">
          <span className="text-xs font-semibold text-slate-500 uppercase">Filter</span>
          {(["ALL", "INFO", "WARN", "ERROR"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilter(level)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition",
                filter === level
                  ? "bg-electric-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600",
              )}
            >
              {level}
              {level !== "ALL" && ` (${counts[level as keyof typeof counts] ?? 0})`}
            </button>
          ))}
        </div>

        {loading && logs.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading system logs…</p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">
            {logs.length === 0
              ? "No platform events recorded yet. Activity will appear here as users register, pay, or open tickets."
              : "No logs match this filter."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[560px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={`${log.timestamp}-${log.message}`}
                className={cn(
                  "px-4 py-3 flex gap-3 items-start border-s-4",
                  log.level === "ERROR"
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/10"
                    : log.level === "WARN"
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                      : log.level === "INFO"
                        ? "border-electric-500 bg-electric-500/5"
                        : "border-slate-400 bg-slate-50 dark:bg-slate-900/30",
                )}
              >
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <p className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                  <p className="mt-1 text-sm font-sans text-slate-800 dark:text-slate-100 break-words">
                    {log.message}
                  </p>
                </div>
                <Badge color={getLevelColor(log.level)}>{log.level}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 text-center">
          Showing {filteredLogs.length} of {logs.length} events
        </div>
      </Card>
    </div>
  );
}
