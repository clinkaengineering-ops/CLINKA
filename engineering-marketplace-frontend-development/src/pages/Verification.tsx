import { useState } from "react";
import { Badge, Button, Card, Progress } from "../components/UI";
import { IconCheck, IconUpload, IconShield, IconFile, IconArrow, IconAlert } from "../components/Icons";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

export default function Verification() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);

  const checks = [
    { label: t("vf.t1"), done: true },
    { label: t("vf.t2"), done: true },
    { label: t("vf.t3"), done: false },
    { label: t("vf.t4"), done: false },
  ];

  const tabs = [
    { label: t("vf.t1"), sub: t("vf.t1s"), desc: t("vf.t1d"), fields: [t("st.fullName"), t("em.natID"), t("st.country"), "DOB"] },
    { label: t("vf.t2"), sub: t("vf.t2s"), desc: t("vf.t2d"), fields: ["License #", "Authority", t("disc.structural"), "Valid until"] },
    { label: t("vf.t3"), sub: t("vf.t3s"), desc: t("vf.t3d"), fields: ["Legal entity", "Registration #", "Tax ID", t("st.country")] },
    { label: t("vf.t4"), sub: t("vf.t4s"), desc: t("vf.t4d"), fields: [t("st.fullName"), "DOB"] },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("vf.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("vf.subtitle")}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold">{t("vf.progress")}</p>
            <p className="text-xs text-slate-500">{t("vf.complete2of4")}</p>
          </div>
          <Badge color="electric">{t("vf.proHalf")}</Badge>
        </div>
        <div className="mt-4"><Progress value={50} /></div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {checks.map((c, i) => (
            <div key={c.label} className={cn("p-3 rounded-xl border flex items-center gap-3", c.done ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-200 dark:border-slate-800")}>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", c.done ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                {c.done ? <IconCheck width={14} height={14} /> : i + 1}
              </div>
              <div>
                <p className="text-xs font-semibold">{c.label}</p>
                <p className="text-[10px] text-slate-500">{c.done ? t("vf.verified") : t("vf.pending")}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <Card className="p-3 h-fit">
          {tabs.map((tt, i) => {
            const done = checks[i].done;
            return (
              <button
                key={tt.label}
                onClick={() => setActive(i)}
                className={cn("w-full px-3 py-3 rounded-lg flex items-center gap-3 text-start text-sm transition", active === i ? "bg-electric-500/10 text-electric-700 dark:text-electric-300" : "hover:bg-slate-50 dark:hover:bg-slate-900")}
              >
                <span className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", done ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                  {done ? <IconCheck width={14} height={14} /> : <IconShield width={14} height={14} />}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{tt.label}</p>
                  <p className="text-[11px] text-slate-500">{tt.sub}</p>
                </div>
              </button>
            );
          })}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Badge color={checks[active].done ? "green" : "amber"}>{checks[active].done ? t("vf.verified") : t("vf.actionReq")}</Badge>
              <h2 className="mt-2 text-xl font-bold">{tabs[active].label}</h2>
              <p className="text-sm text-slate-500 mt-1">{tabs[active].desc}</p>
            </div>
            {!checks[active].done && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <IconAlert width={14} height={14} /> {t("vf.eta")}
              </div>
            )}
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {tabs[active].fields.map(f => (
              <div key={f}>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{f}</label>
                <input className="mt-1.5 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" placeholder={f} />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("vf.uploadDocs")}</label>
            <div className="mt-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-electric-500 transition group cursor-pointer">
              <div className="h-12 w-12 mx-auto rounded-xl bg-electric-500/10 text-electric-600 flex items-center justify-center group-hover:scale-110 transition"><IconUpload width={20} height={20} /></div>
              <p className="mt-3 text-sm font-semibold">{t("vf.dropHere")}</p>
              <p className="text-xs text-slate-500">{t("vf.dropHelp")}</p>
              <Button size="sm" variant="secondary" className="mt-4">{t("common.browse")}</Button>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {[
              { name: "national_id_front.jpg", size: "1.2 MB", status: t("vf.uploaded"), color: "green" as const },
              { name: "syndicate_license.pdf", size: "640 KB", status: t("vf.reviewing"), color: "amber" as const },
            ].map(f => (
              <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="h-9 w-9 rounded-lg bg-electric-500/10 text-electric-600 flex items-center justify-center"><IconFile width={16} height={16} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-[11px] text-slate-500">{f.size}</p>
                </div>
                <Badge color={f.color}>{f.status}</Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost">{t("common.draft")}</Button>
            <Button icon={<IconArrow width={14} height={14} />}>{t("vf.submitReview")}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
