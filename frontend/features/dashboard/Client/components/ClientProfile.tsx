"use client";

import Link from "next/link";
import { Card, Badge, Avatar, Button } from "@/components/UI";
import { IconMail, IconSettings } from "@/components/Icons";
import type { Me } from "@/types";

interface Props {
  me: Me | null;
  loading: boolean;
  error: string | null;
}

export function ClientProfile({ me, loading, error }: Props) {
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
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-sm text-rose-500">
        Failed to load profile: {error}
      </Card>
    );
  }

  return (
    <Card className="p-6">
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
        <Link href="/settings">
          <Button
            size="sm"
            variant="secondary"
            icon={<IconSettings width={14} height={14} />}
          >
            Edit in Settings
          </Button>
        </Link>
      </div>

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
            {me?.profile?.bio || "No bio yet. Add one in Settings."}
          </p>
        </div>
      </div>
    </Card>
  );
}
