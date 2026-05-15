import { useState } from "react";
import { Badge, Button, Card } from "../components/UI";
import { IconSearch, IconClock, IconWallet, IconLocation, IconBolt, IconArrow, IconStar, IconBriefcase } from "../components/Icons";
import { projects } from "../lib/data";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

export default function ProjectMarketplace() {
  const { t } = useI18n();
  const [active, setActive] = useState("All");
  const cats = [
    { id: "All", label: t("disc.all") },
    { id: "Structural", label: t("disc.structural") },
    { id: "Architecture", label: t("disc.architecture") },
    { id: "Civil", label: t("disc.civil") },
    { id: "MEP / BIM", label: t("disc.mepBim") },
    { id: "Geotechnical", label: t("disc.geotech") },
    { id: "Project Management", label: t("disc.pm") },
  ];
  const [selected, setSelected] = useState<string>(projects[0].id);
  const project = projects.find(p => p.id === selected) ?? projects[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t("pm.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t("pm.saved")}</Button>
          <Button icon={<IconBriefcase width={16} height={16} />}>{t("common.postProject")}</Button>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <IconSearch width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder={t("pm.searchKeyword")} className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
          </div>
          <select className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm">
            <option>{t("pm.anyBudget")}</option><option>$1k – $5k</option><option>$5k – $15k</option><option>$15k+</option>
          </select>
          <select className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm">
            <option>{t("pm.anyTimeline")}</option><option>{t("pm.under4w")}</option><option>{t("pm.1to3m")}</option><option>{t("pm.3plus")}</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} className={cn("px-3.5 h-8 rounded-full text-xs font-semibold border transition", active === c.id ? "bg-electric-500 text-white border-electric-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-electric-600 hover:border-electric-500/40")}>{c.label}</button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Projects list */}
        <div className="space-y-4">
          {projects.map(p => (
            <Card key={p.id} onClick={() => setSelected(p.id)} className={cn("p-5 cursor-pointer hover:border-electric-500/40 transition", selected === p.id && "border-electric-500/60 ring-2 ring-electric-500/20")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{p.title}</h3>
                    {p.featured && <Badge color="amber"><IconBolt width={10} height={10} /> {t("common.featured")}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{p.description}</p>
                </div>
                <Badge color="electric">{p.category}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><IconWallet width={14} height={14} className="text-electric-500" />{p.budget}</span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><IconClock width={14} height={14} className="text-electric-500" />{p.timeline}</span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><IconLocation width={14} height={14} className="text-electric-500" />{t("common.remote")}</span>
                <span className="ms-auto text-xs text-slate-500">{p.bids} {t("common.bids")} · {t("common.posted")} {p.posted}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.skills.map(s => <Badge key={s}>{s}</Badge>)}
              </div>
            </Card>
          ))}
        </div>

        {/* Detail / Bid panel */}
        <div className="lg:sticky lg:top-20 h-fit">
          <Card className="overflow-hidden">
            <div className="p-5 bg-gradient-to-br from-navy-900 to-navy-800 text-white">
              <Badge className="!bg-white/10 !text-white !border-white/20">{project.category}</Badge>
              <h3 className="mt-3 text-xl font-bold">{project.title}</h3>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-white/10 p-2.5">
                  <p className="text-white/60 text-[10px] uppercase">{t("common.budget")}</p>
                  <p className="font-bold mt-0.5">{project.budget}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <p className="text-white/60 text-[10px] uppercase">{t("common.timeline")}</p>
                  <p className="font-bold mt-0.5">{project.timeline}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-2.5">
                  <p className="text-white/60 text-[10px] uppercase">{t("stat.bids")}</p>
                  <p className="font-bold mt-0.5">{project.bids}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("common.client")}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-9 w-9 rounded-lg bg-electric-500/10 flex items-center justify-center text-electric-600 font-bold">{project.client[0]}</div>
                  <div>
                    <p className="text-sm font-semibold">{project.client}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><IconStar width={12} height={12} className="text-amber-500" />{project.clientRating} · {t("common.verified")}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("common.description")}</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{project.description}</p>
              </div>

              {/* Bid form */}
              <div className="rounded-xl border border-electric-500/30 bg-electric-500/5 p-4">
                <p className="text-sm font-bold">{t("pm.bidTitle")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t("pm.yourPrice")}</label>
                    <input defaultValue="$22,500" className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t("pm.deliveryWeeks")}</label>
                    <input defaultValue="9" className="mt-1 w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm" />
                  </div>
                </div>
                <textarea placeholder={t("pm.coverLetter")} rows={3} className="mt-3 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{t("pm.serviceFee")} <span className="font-bold text-slate-900 dark:text-white">$20,700</span></span>
                </div>
                <Button className="mt-3 w-full" icon={<IconArrow width={14} height={14} />}>{t("pm.submitBid")}</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
