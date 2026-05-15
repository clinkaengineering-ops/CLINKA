import { useState } from "react";
import { Avatar, Badge, Card } from "../components/UI";
import { IconSearch, IconPaperclip, IconSend, IconMore, IconFile, IconCheck } from "../components/Icons";
import { messages } from "../lib/data";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

export default function Messaging() {
  const { t } = useI18n();
  const [active, setActive] = useState(messages[0].id);
  const conv = messages.find(m => m.id === active) ?? messages[0];

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-9rem)]">
      <Card className="h-full overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[300px_1fr_320px] h-full">
          {/* Conversation list */}
          <aside className="border-e border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold">{t("msg.inbox")}</h2>
              <div className="mt-3 relative">
                <IconSearch width={14} height={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input placeholder={t("msg.searchConv")} className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.map(m => (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={cn("w-full p-3 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 transition text-start", active === m.id ? "bg-electric-500/5" : "hover:bg-slate-50 dark:hover:bg-slate-900/50")}
                >
                  <div className="relative">
                    <Avatar name={m.name} size={42} />
                    {m.online && <span className="absolute bottom-0 end-0 h-3 w-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className="text-sm font-semibold truncate">{m.name}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{m.preview}</p>
                  </div>
                  {m.unread > 0 && <Badge color="electric">{m.unread}</Badge>}
                </button>
              ))}
            </div>
          </aside>

          {/* Conversation */}
          <main className="flex flex-col min-w-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={conv.name} size={40} />
                <div>
                  <p className="font-semibold">{conv.name}</p>
                  <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("msg.typing")}</p>
                </div>
              </div>
              <button className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"><IconMore /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
              <DateSep label={t("msg.today")} />
              <Bubble side="them" name={conv.name} time={t("msg.read")}>{t("msg.b1")}</Bubble>
              <Bubble side="them" name={conv.name} time={t("msg.read")}>
                <FileAttach name="Column_Schedule_R3.pdf" size="2.4 MB" />
              </Bubble>
              <Bubble side="me" time={t("msg.read")}>{t("msg.b1Me")}</Bubble>
              <Bubble side="them" name={conv.name} time={t("msg.read")}>{t("msg.b2")}</Bubble>
              <Bubble side="them" name={conv.name} time={t("msg.read")}>
                <FileAttach name="ETABS_Lateral_Analysis.zip" size="84 MB" model />
              </Bubble>
              <Bubble side="me" time={t("msg.read")}>{t("msg.b2Me")}</Bubble>
              <Bubble side="them" name={conv.name} time={t("msg.read")}>{t("msg.b3")}</Bubble>
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 focus-within:ring-2 focus-within:ring-electric-500/30">
                <button className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"><IconPaperclip width={16} height={16} /></button>
                <textarea rows={1} placeholder={t("msg.write")} className="flex-1 bg-transparent text-sm focus:outline-none resize-none py-2" />
                <button className="h-9 w-9 rounded-lg bg-electric-500 hover:bg-electric-400 text-white flex items-center justify-center shadow-md shadow-electric-500/30"><IconSend width={16} height={16} /></button>
              </div>
            </div>
          </main>

          {/* Project context */}
          <aside className="border-s border-slate-200 dark:border-slate-800 hidden lg:flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{t("msg.project")}</p>
              <p className="mt-1 font-bold text-sm">12-Story Mixed-Use Tower</p>
              <p className="text-xs text-slate-500">{t("msg.contract")}</p>
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{t("msg.pinned")}</p>
              <FileAttach name="Project_Brief_v2.pdf" size="1.1 MB" />
            </div>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{t("msg.shared")}</p>
              <div className="space-y-2">
                {["Column_Schedule_R3.pdf", "ETABS_Lateral_Analysis.zip", "Foundation_Plan.dwg"].map(f => <FileAttach key={f} name={f} size="—" small />)}
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">{t("msg.milestones")}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><IconCheck width={12} height={12} /></span>Concept</div>
                <div className="flex items-center gap-2"><span className="h-5 w-5 rounded-full bg-electric-500 text-white flex items-center justify-center"><IconCheck width={12} height={12} /></span>Schematic</div>
                <div className="flex items-center gap-2 text-slate-500"><span className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700" />Detailed Design</div>
              </div>
            </div>
          </aside>
        </div>
      </Card>
    </div>
  );
}

const DateSep = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);

const Bubble = ({ side, name, time, children }: { side: "me" | "them"; name?: string; time: string; children: React.ReactNode }) => (
  <div className={cn("flex gap-2 max-w-[80%]", side === "me" ? "ms-auto flex-row-reverse" : "")}>
    {side === "them" && <Avatar name={name ?? "U"} size={28} />}
    <div>
      <div className={cn("rounded-2xl px-4 py-2.5 text-sm shadow-sm", side === "me" ? "bg-electric-500 text-white rounded-tr-md" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-md")}>
        {children}
      </div>
      <p className={cn("text-[10px] text-slate-400 mt-1", side === "me" ? "text-end" : "")}>{time}</p>
    </div>
  </div>
);

const FileAttach = ({ name, size, model, small }: { name: string; size: string; model?: boolean; small?: boolean }) => (
  <div className={cn("flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2", small ? "p-1.5" : "")}>
    <span className={cn("rounded-md flex items-center justify-center text-white", small ? "h-7 w-7" : "h-9 w-9", model ? "bg-violet-500" : "bg-electric-500")}>
      <IconFile width={small ? 12 : 16} height={small ? 12 : 16} />
    </span>
    <div className="flex-1 min-w-0">
      <p className={cn("font-medium truncate", small ? "text-xs" : "text-sm")}>{name}</p>
      <p className="text-[10px] text-slate-500">{size}{model && " · BIM model"}</p>
    </div>
  </div>
);
