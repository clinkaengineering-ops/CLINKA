"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Badge, Button, Card } from "@/components/UI";
import {
  banUserAdmin,
  fetchAllBans,
  lookupAdminUser,
  unbanUserAdmin,
  type AdminBan,
} from "../api/admin.api";

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function reasonLabel(reason: AdminBan["reason"]) {
  return reason === "CONTACT_INFO_SHARING"
    ? "Contact info sharing"
    : "Manual ban";
}

function reasonBadgeColor(
  reason: AdminBan["reason"],
): "amber" | "rose" | "slate" {
  return reason === "CONTACT_INFO_SHARING" ? "rose" : "amber";
}

function reviewText(ban: AdminBan): string | null {
  if (ban.triggerMessage?.trim()) return ban.triggerMessage.trim();
  if (ban.note?.trim()) return ban.note.trim();
  return null;
}

export function BanManagementPanel() {
  const [bans, setBans] = useState<AdminBan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [note, setNote] = useState("");
  const [banError, setBanError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [modalOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBans(await fetchAllBans());
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnban = async (userId: number) => {
    setActionUserId(userId);
    try {
      await unbanUserAdmin(userId);
      await load();
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setActionUserId(null);
    }
  };

  const handleBanSubmit = async () => {
    setBanError(null);
    const id = identifier.trim();
    if (!id) {
      setBanError("Enter a user ID or email");
      return;
    }
    setActionUserId(-1);
    try {
      const user = await lookupAdminUser(id);
      await banUserAdmin(user.id, note.trim() || undefined);
      setModalOpen(false);
      setIdentifier("");
      setNote("");
      await load();
    } catch (err) {
      setBanError(axiosMessage(err));
    } finally {
      setActionUserId(null);
    }
  };

  const banModal =
    mounted && modalOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onClick={() => setModalOpen(false)}
          >
            <Card
              className="w-full max-w-md p-5 space-y-4 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ban-user-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="ban-user-title" className="font-bold text-lg">
                Ban user for 30 days
              </h3>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  User ID or email
                </label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  placeholder="42 or user@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none"
                />
              </div>
              {banError && <p className="text-sm text-rose-500">{banError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBanSubmit} disabled={actionUserId === -1}>
                  {actionUserId === -1 ? "Banning…" : "Confirm ban"}
                </Button>
              </div>
            </Card>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
    <Card className="p-0 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
        <div>
          <h2 className="font-bold">Ban management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            30-day suspensions for policy violations
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Ban user
        </Button>
      </div>

      {error && (
        <p className="px-4 py-2 text-sm text-rose-500 border-b border-rose-500/20">
          {error}
        </p>
      )}

      {loading ? (
        <p className="p-8 text-center text-slate-500 text-sm">Loading bans…</p>
      ) : bans.length === 0 ? (
        <p className="p-8 text-center text-slate-500 text-sm">No ban records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs uppercase">
                <th className="text-start p-3 font-semibold">User</th>
                <th className="text-start p-3 font-semibold">Role</th>
                <th className="text-start p-3 font-semibold min-w-[140px]">Reason</th>
                <th className="text-start p-3 font-semibold min-w-[220px]">
                  Flagged message
                </th>
                <th className="text-start p-3 font-semibold">Banned</th>
                <th className="text-start p-3 font-semibold">Expires</th>
                <th className="text-start p-3 font-semibold">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr
                  key={ban.id}
                  className="border-b border-slate-100 dark:border-slate-800/80"
                >
                  <td className="p-3">
                    <p className="font-medium">{ban.userName}</p>
                    <p className="text-xs text-slate-500">{ban.userEmail}</p>
                  </td>
                  <td className="p-3">{ban.userRole}</td>
                  <td className="p-3 align-top">
                    <Badge color={reasonBadgeColor(ban.reason)}>
                      {reasonLabel(ban.reason)}
                    </Badge>
                    {ban.bannedByName && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        by {ban.bannedByName}
                      </p>
                    )}
                  </td>
                  <td className="p-3 align-top max-w-xs">
                    {reviewText(ban) ? (
                      <blockquote className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                        {reviewText(ban)}
                      </blockquote>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3">{formatDate(ban.bannedAt)}</td>
                  <td className="p-3">{formatDate(ban.expiresAt)}</td>
                  <td className="p-3">
                    <Badge color={ban.active ? "amber" : "slate"}>
                      {ban.active ? "Active" : "Expired"}
                    </Badge>
                  </td>
                  <td className="p-3 text-end">
                    {ban.active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actionUserId === ban.userId}
                        onClick={() => handleUnban(ban.userId)}
                      >
                        {actionUserId === ban.userId ? "…" : "Unban"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    {banModal}
    </>
  );
}
