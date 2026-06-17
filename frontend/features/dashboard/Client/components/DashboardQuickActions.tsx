"use client";

import Link from "next/link";
import { Button, Card } from "@/components/UI";
import { IconMessage, IconWallet, IconStar } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Message, Notification } from "@/types";

export function DashboardQuickActions({
  messages,
  notifications,
}: {
  messages: Message[];
  notifications: Notification[];
}) {
  const { t } = useI18n();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-5">
        <h3 className="font-bold text-sm">{t("cd.quickActions")}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/escrow">
            <Button size="sm" variant="secondary" icon={<IconWallet width={14} height={14} />}>
              {t("side.escrow")}
            </Button>
          </Link>
          <Link href="/reviews">
            <Button size="sm" variant="secondary" icon={<IconStar width={14} height={14} />}>
              {t("side.reviews")}
            </Button>
          </Link>
          <Link href="/messages">
            <Button size="sm" variant="secondary" icon={<IconMessage width={14} height={14} />}>
              {t("side.messages")}
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-sm">{t("cd.notifications")}</h3>
        <div className="mt-4 space-y-2">
          {notifications.length === 0 && messages.length === 0 ? (
            <p className="text-xs text-slate-500">{t("cd.noNotifications")}</p>
          ) : (
            <>
              {notifications.slice(0, 3).map((n) => (
                <p key={n.id} className="text-xs text-slate-600 dark:text-slate-400">
                  • {n.title}
                </p>
              ))}
              {messages.slice(0, 2).map((m) => (
                <Link
                  key={m.id}
                  href="/messages"
                  className="block text-xs text-electric-600 hover:underline"
                >
                  {m.name}: {m.preview}
                </Link>
              ))}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
