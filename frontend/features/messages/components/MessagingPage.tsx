"use client";
import { useState } from "react";
import { Avatar, Badge, Card } from "@/components/UI";
import { IconSearch, IconSend, IconMore } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";

const mockConversations = [
  { id: "m1", name: "Layla Hassan", preview: "Uploaded the latest column schedule.", time: "2m", unread: 2, online: true },
  { id: "m2", name: "Meridian Developments", preview: "Milestone 2 approved. Funds released.", time: "1h", unread: 0, online: false },
  { id: "m3", name: "Marcus Chen", preview: "Federated model ready for clash review.", time: "3h", unread: 1, online: true },
];

export function MessagingPage() {
  const { t } = useI18n();
  const [active, setActive] = useState(mockConversations[0].id);
  const [message, setMessage] = useState("");
  const conv = mockConversations.find(m => m.id === active) ?? mockConversations[0];
  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
      <Card className="h-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-full">
          <aside className="border-e border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold">{t("msg.inbox")}</h2>
              <div className="mt-3 relative"><IconSearch width={14} height={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder={t("msg.searchConv")} className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none" /></div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockConversations.map(m => (
                <button key={m.id} onClick={() => setActive(m.id)} className={cn("w-full p-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 text-start transition", active === m.id ? "bg-electric-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-900/50")}>
                  <div className="relative"><Avatar name={m.name} size={42} />{m.online && <span className="absolute bottom-0 end-0 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2"><p className="text-sm font-semibold truncate">{m.name}</p><span className="text-[10px] text-slate-400">{m.time}</span></div>
                    <p className="text-xs text-slate-500 truncate">{m.preview}</p>
                  </div>
                  {m.unread > 0 && <Badge color="electric">{m.unread}</Badge>}
                </button>
              ))}
            </div>
          </aside>
          <main className="flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3"><Avatar name={conv.name} size={40} /><div><p className="font-semibold">{conv.name}</p>{conv.online && <p className="text-xs text-emerald-500">Online</p>}</div></div>
              <button className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><IconMore /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
              <p className="text-center text-xs text-slate-400">Today</p>
              <div className="flex gap-3"><Avatar name={conv.name} size={32} /><div className="max-w-sm bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-sm">Hi! I uploaded the latest column schedule for your review.</div></div>
              <div className="flex gap-3 justify-end"><div className="max-w-sm bg-electric-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">Thanks, I will take a look now.</div></div>
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
                <input className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-slate-400" placeholder={t("msg.typeMsg")} value={message} onChange={e => setMessage(e.target.value)} />
                <button className="h-8 w-8 rounded-lg bg-electric-500 text-white flex items-center justify-center hover:bg-electric-400 transition"><IconSend width={14} height={14} /></button>
              </div>
            </div>
          </main>
        </div>
      </Card>
    </div>
  );
}
