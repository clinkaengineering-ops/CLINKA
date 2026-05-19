// features/client/components/ClientProfile.tsx
// Pure presentational component — receives me, loading, error, onUpdate as props.
// Does NOT call useMe() itself. Data comes from ClientDashboardPage.
"use client";
import { useState } from "react";
import {
  Card,
  Button,
  Avatar,
  Badge,
  Field,
  Input,
  Textarea,
} from "@/components/UI";
import {
  IconMail,
  IconEdit,
  IconCheck,
  IconClose,
} from "@/components/Icons";
import type { Me } from "@/types";

interface Props {
  me: Me | null;
  loading: boolean;
  error: string | null;
  onUpdate: (payload: { name?: string; bio?: string }) => Promise<void>;
}

export function ClientProfile({ me, loading, error, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const openEdit = () => {
    setName(me?.name ?? "");
    setBio(me?.profile?.bio ?? "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    try {
      // Pass undefined (not empty string) when the field didn't change,
      // so the backend skips the update for that field.
      await onUpdate({
        name: name !== me?.name ? name : undefined,
        // bio can be "" (clearing it) so we use !== undefined check, not falsy
        bio: bio !== (me?.profile?.bio ?? "") ? bio : undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </Card>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Card className="p-6 text-sm text-rose-500">
        Failed to load profile: {error}
      </Card>
    );
  }

  // ── Profile card ────────────────────────────────────────────────────────────
  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={me?.name ?? "?"} size={56} ring />
          <div>
            <h2 className="text-lg font-bold">{me?.name ?? "—"}</h2>
            <p className="text-sm text-slate-500 flex items-center gap-1.5">
              <IconMail width={13} height={13} />
              {me?.email ?? "—"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          icon={<IconEdit width={14} height={14} />}
          onClick={openEdit}
        >
          Edit
        </Button>
      </div>

      {/* Info grid */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Role
          </p>
          <Badge color={me?.role === "CLIENT" ? "blue" : "violet"}>
            {me?.role ?? "—"}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Member since
          </p>
          <p className="font-medium">
            {me?.createdAt
              ? new Date(me.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Bio
          </p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {me?.profile?.bio || "No bio yet."}
          </p>
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Edit Profile</h3>
              <button
                onClick={cancelEdit}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                aria-label="Close"
              >
                <IconClose width={18} height={18} />
              </button>
            </div>

            <Field label="Full name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </Field>

            <Field label="Bio">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself…"
                rows={4}
              />
            </Field>

            {/* Email is identity — not editable here */}
            <Field label="Email">
              <Input
                value={me?.email ?? ""}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={cancelEdit} disabled={saving}>
                Cancel
              </Button>
              <Button
                icon={<IconCheck width={14} height={14} />}
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
