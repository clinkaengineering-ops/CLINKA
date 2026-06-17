"use client";

import { useEffect, useState } from "react";
import { Card, Button, Badge } from "@/components/UI";
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

function getLevelIcon(level: string) {
  switch (level) {
    case "ERROR":
      return "🔴";
    case "WARN":
      return "🟡";
    case "INFO":
      return "🔵";
    case "DEBUG":
      return "⚪";
    default:
      return "⚪";
  }
}

export function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARN" | "INFO">("ALL");

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = filter === "ALL" ? logs : logs.filter((log) => log.level === filter);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
        <div>
          <h2 className="font-bold">System Logs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time application logs and critical events. Refreshes every 30 seconds.
          </p>
        </div>
        <Button size="sm" onClick={load} disabled={loading} variant="secondary">
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && <p className="p-4 text-sm text-rose-500 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">{error}</p>}

      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-2 items-center flex-wrap">
        <span className="text-xs font-semibold text-slate-500 uppercase">Filter:</span>
        {(["ALL", "INFO", "WARN", "ERROR"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filter === level
                ? "bg-electric-500 text-white"
                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {loading && logs.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">Loading system logs...</p>
      ) : filteredLogs.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">No logs found for this filter.</p>
      ) : (
        <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto font-mono text-xs">
          {filteredLogs.map((log, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-l-4 flex gap-3 ${
                log.level === "ERROR"
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-100"
                  : log.level === "WARN"
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
                    : log.level === "INFO"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                      : "border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-900 dark:text-slate-100"
              }`}
            >
              <div className="flex-shrink-0 pt-0.5">{getLevelIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <p className="whitespace-nowrap text-xs opacity-75">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <p className="mt-1 break-words">{log.message}</p>
              </div>
              <div className="flex-shrink-0 pt-1">
                <Badge color={getLevelColor(log.level)}>{log.level}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 text-center">
        Showing {filteredLogs.length} of {logs.length} logs
      </div>
    </Card>
  );
}
