"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import {
  fetchSupportTickets,
  updateSupportTicket,
  type AdminSupportTicket,
} from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(status: AdminSupportTicket["status"]) {
  if (status === "OPEN") return { label: "Open", color: "amber" as const };
  if (status === "SOLVED") return { label: "Solved", color: "green" as const };
  return { label: "Unresolved", color: "rose" as const };
}

export function AdminSupportTicketsPanel() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [solution, setSolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupportTickets();
      setTickets(data.tickets);
      setSelectedId((prev) => prev ?? data.tickets[0]?.id ?? null);
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  async function resolve(status: "SOLVED" | "UNRESOLVED") {
    if (!selected || selected.status !== "OPEN") return;
    if (!solution.trim()) {
      setActionError(t("help.admin.solutionRequired"));
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await updateSupportTicket(selected.id, { status, solution: solution.trim() });
      setSolution("");
      await load();
    } catch (err) {
      setActionError(axiosMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <Card className="p-8 text-center text-slate-500">{t("common.loading")}</Card>;
  }

  if (error) {
    return (
      <Card className="p-8 text-center text-rose-600">
        <p>{error}</p>
        <Button className="mt-4" size="sm" variant="secondary" onClick={load}>
          {t("common.retry")}
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-2 p-0 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 font-semibold">
          {t("help.admin.tickets")} ({tickets.length})
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">{t("help.admin.empty")}</p>
          ) : (
            tickets.map((ticket) => {
              const badge = statusBadge(ticket.status);
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(ticket.id);
                    setSolution("");
                    setActionError(null);
                  }}
                  className={`w-full text-left px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                    selectedId === ticket.id ? "bg-slate-50 dark:bg-slate-900/60" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm line-clamp-1">{ticket.subject}</p>
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{ticket.name} · {ticket.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(ticket.createdAt)}</p>
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="lg:col-span-3 p-6">
        {!selected ? (
          <p className="text-slate-500">{t("help.admin.selectTicket")}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">{selected.subject}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selected.name} ·{" "}
                  <a href={`mailto:${selected.email}`} className="text-brand-teal hover:underline">
                    {selected.email}
                  </a>
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(selected.createdAt)}</p>
              </div>
              <Badge color={statusBadge(selected.status).color}>
                {statusBadge(selected.status).label}
              </Badge>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 text-sm whitespace-pre-wrap">
              {selected.message}
            </div>

            {selected.status !== "OPEN" && selected.solution && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("help.admin.solution")}
                </p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{selected.solution}</p>
                {selected.resolvedBy && (
                  <p className="mt-2 text-xs text-slate-400">
                    {t("help.admin.resolvedBy")} {selected.resolvedBy.name}
                    {selected.resolvedAt ? ` · ${formatDate(selected.resolvedAt)}` : ""}
                  </p>
                )}
              </div>
            )}

            {selected.status === "OPEN" && (
              <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <p className="text-sm font-semibold">{t("help.admin.resolveTitle")}</p>
                {actionError && (
                  <p className="text-sm text-rose-600">{actionError}</p>
                )}
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={4}
                  placeholder={t("help.admin.solutionPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => resolve("SOLVED")}
                  >
                    {actionLoading ? t("common.loading") : t("help.admin.markSolved")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actionLoading}
                    onClick={() => resolve("UNRESOLVED")}
                  >
                    {t("help.admin.markUnresolved")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
