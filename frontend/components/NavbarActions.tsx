"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Button } from "@/components/UI";
import { IconBell, IconMessage } from "@/components/Icons";
import { cn } from "@/utils/cn";
import useAuthStore from "@/store/authStore";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { fetchUnreadMessagesCount } from "@/features/messages/api/messages.api";

export function NavbarActions({ showInbox = true }: { showInbox?: boolean }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !showInbox) return;
    fetchUnreadMessagesCount()
      .then(setMsgUnread)
      .catch(() => setMsgUnread(0));
    const id = setInterval(() => {
      fetchUnreadMessagesCount().then(setMsgUnread).catch(() => setMsgUnread(0));
    }, 30000);
    return () => clearInterval(id);
  }, [user, showInbox]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!user) return null;

  const dashHref = user.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <div className="flex items-center gap-2">
      {showInbox && user.role !== "ADMIN" && (
        <Link
          href="/messages"
          className="relative h-10 w-10 rounded-lg border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
          aria-label="Messages"
        >
          <IconMessage width={18} height={18} />
          {msgUnread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
          )}
        </Link>
      )}

      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative h-10 w-10 rounded-lg border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
          aria-label="Notifications"
        >
          <IconBell width={18} height={18} />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[8px] h-2 px-0.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute end-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs text-electric-600 hover:underline"
                  onClick={() => markAllRead()}
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">No notifications</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-start px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 last:border-0",
                        !n.read && "bg-electric-500/5",
                      )}
                      onClick={async () => {
                        if (!n.read) await markRead(n.id);
                        setNotifOpen(false);
                        if (n.link) router.push(n.link);
                      }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Link href={dashHref} className="rounded-full">
        <Avatar name={user.name} src={user.avatarUrl ?? undefined} size={36} ring />
      </Link>
    </div>
  );
}
