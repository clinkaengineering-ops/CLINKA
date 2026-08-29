"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/UI";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import {
  fetchNotificationPrefs,
  updateNotificationPrefs,
} from "@/features/notifications/api/notifications.api";
import type { NotificationPrefs } from "@/types";

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={cn(
        "w-10 h-6 rounded-full relative transition",
        on ? "bg-electric-500" : "bg-slate-300 dark:bg-slate-700",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition",
          on ? "start-5" : "start-1",
        )}
      />
    </button>
  );
}

const PREF_META: {
  key: keyof NotificationPrefs;
  label: string;
  roles: ("CLIENT" | "ENGINEER" | "ADMIN")[];
}[] = [
  { key: "newBid", label: "New bid received", roles: ["CLIENT"] },
  { key: "bidAccepted", label: "Bid accepted", roles: ["ENGINEER"] },
  { key: "fundsReleased", label: "Funds released", roles: ["CLIENT", "ENGINEER"] },
  { key: "newMessage", label: "New message", roles: ["CLIENT", "ENGINEER", "ADMIN"] },
  { key: "newProjectPosted", label: "New project posted", roles: ["ENGINEER"] },
];

export function NotificationsSettingsTab() {
  const { t } = useI18n();
  const role = useAuthStore((s) => s.user?.role);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchNotificationPrefs();
      setPrefs(p);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = PREF_META.filter(
    (m) => role && m.roles.includes(role as "CLIENT" | "ENGINEER" | "ADMIN"),
  );

  async function handleToggle(key: keyof NotificationPrefs, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setError(null);
    try {
      const updated = await updateNotificationPrefs(next);
      setPrefs(updated);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to save");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Card className="p-6 text-sm text-slate-500">{t("common.loading")}</Card>;
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.notif")}</h2>
      <p className="text-sm text-slate-500 mt-1">{t("st.notifSub")}</p>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
      {saving && (
        <p className="mt-2 text-xs text-slate-400">Saving…</p>
      )}
      <div className="mt-5 space-y-3">
        {visible.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <p className="text-sm">{item.label}</p>
            <Toggle
              on={!!prefs?.[item.key]}
              onChange={(v) => handleToggle(item.key, v)}
              disabled={saving}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
