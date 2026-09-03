"use client";

import { useCallback, useEffect, useState } from "react";
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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState("");
  const [targetIdFilter, setTargetIdFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (userIdFilter) filters.userId = Number(userIdFilter);
      if (targetIdFilter) filters.targetId = targetIdFilter;
      if (actionFilter) filters.action = actionFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const data = await fetchSystemLogs(page, limit, filters);
      setLogs(data);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, limit, userIdFilter, targetIdFilter, actionFilter, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">System Audit Logs</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed chronological record of all system events and admin actions.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </Button>
      </div>

      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            type="number"
            placeholder="Actor User ID"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Target ID"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700"
            value={targetIdFilter}
            onChange={(e) => setTargetIdFilter(e.target.value)}
          />
          <input
            type="text"
            placeholder="Action (e.g., auth.login)"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <input
            type="date"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className="w-full px-3 py-2 text-sm border rounded-md dark:bg-slate-800 dark:border-slate-700"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setUserIdFilter("");
              setTargetIdFilter("");
              setActionFilter("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {error && (
          <p className="p-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20">
            {error}
          </p>
        )}

        {loading && logs.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">Loading system logs…</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">
            No logs match the current filters.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Actor ID</th>
                  <th className="px-4 py-3 font-semibold">Target ID</th>
                  <th className="px-4 py-3 font-semibold w-full">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr
                    key={`${log.timestamp}-${log.message}`}
                    className={cn(
                      "hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors",
                      log.level === "ERROR" && "bg-rose-50/30 dark:bg-rose-900/5",
                      log.level === "WARN" && "bg-amber-50/30 dark:bg-amber-900/5"
                    )}
                  >
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={getLevelColor(log.level)}>{log.level}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {log.action || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.actorId || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.targetId || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate max-w-md">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 flex justify-between items-center">
          <div>
            Showing {logs.length} events
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={logs.length < limit}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
