import { useState } from "react";
import { Avatar, Badge, Button, Card, VerifiedBadge } from "../components/UI";
import { IconSearch, IconStar, IconLocation, IconFilter, IconBolt, IconArrow } from "../components/Icons";
import { engineers } from "../lib/data";
import type { PageKey } from "../components/AppShell";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

export default function EngineerMarketplace({ setPage }: { setPage: (p: PageKey) => void }) {
  const { t } = useI18n();
  const [active, setActive] = useState("All");
  const disciplines = [
    { id: "All", label: t("disc.all") },
    { id: "Structural", label: t("disc.structural") },
    { id: "Architecture", label: t("disc.architecture") },
    { id: "BIM", label: t("disc.bim") },
    { id: "MEP", label: t("disc.mep") },
    { id: "Civil", label: t("disc.civil") },
    { id: "Geotechnical", label: t("disc.geotech") },
    { id: "Project Management", label: t("disc.pm") },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("em.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t("em.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<IconFilter width={16} height={16} />}>{t("common.filters")}</Button>
          <Button>{t("common.postProject")}</Button>
        </div>
      </div>

      {/* Search bar + discipline pills */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <IconSearch width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder={t("em.searchByName")} className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
          </div>
          <div className="flex-1 relative">
            <IconLocation width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder={t("em.location")} className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" />
          </div>
          <Button size="lg" className="md:w-32">{t("common.search")}</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {disciplines.map(d => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={cn(
                "px-3.5 h-8 rounded-full text-xs font-semibold border transition",
                active === d.id
                  ? "bg-electric-500 text-white border-electric-500 shadow-md shadow-electric-500/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-electric-500/40 hover:text-electric-600"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters sidebar */}
        <Card className="p-5 h-fit hidden lg:block sticky top-20">
          <h3 className="font-bold text-sm">{t("em.refine")}</h3>
          <FilterGroup title={t("em.hourlyRate")}>
            <Range />
          </FilterGroup>
          <FilterGroup title={t("em.experience")}>
            {[t("em.exp1"), t("em.exp2"), t("em.exp3"), t("em.exp4")].map(o => (
              <Check key={o} label={o} />
            ))}
          </FilterGroup>
          <FilterGroup title={t("em.verification")}>
            <Check label={t("em.synd")} defaultChecked />
            <Check label={t("em.natID")} defaultChecked />
            <Check label={t("em.company")} />
          </FilterGroup>
          <FilterGroup title={t("em.availability")}>
            {[t("em.av1"), t("em.av2"), t("em.av3")].map(o => <Check key={o} label={o} />)}
          </FilterGroup>
          <FilterGroup title={t("em.languages")}>
            {["English", "العربية", "Français", "Español", "中文"].map(o => <Check key={o} label={o} />)}
          </FilterGroup>
        </Card>

        {/* Engineer grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500"><span className="font-semibold text-slate-900 dark:text-white">{engineers.length} {t("common.engineers")}</span> {t("em.matched")}</p>
            <select className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs">
              <option>{t("em.sortBest")}</option>
              <option>{t("em.sortRating")}</option>
              <option>{t("em.sortRate")}</option>
              <option>{t("em.sortActive")}</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {engineers.map(e => (
              <Card key={e.id} className="p-5 hover:-translate-y-1 hover:border-electric-500/40 hover:shadow-xl hover:shadow-electric-500/10 transition group">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar name={e.name} size={56} />
                    {e.available === "now" && <span className="absolute bottom-0 end-0 h-3.5 w-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold truncate">{e.name}</p>
                      {e.verified && <VerifiedBadge size={14} />}
                      {e.topRated && <Badge color="amber"><IconBolt width={10} height={10} /> {t("common.topRated")}</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{e.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><IconLocation width={12} height={12} />{e.location}</span>
                      <span className="flex items-center gap-1"><IconStar width={12} height={12} className="text-amber-500" /><span className="font-semibold text-slate-900 dark:text-white">{e.rating}</span> ({e.reviews})</span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="text-lg font-bold text-electric-600 dark:text-electric-400">${e.hourly}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t("common.perHour")}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{e.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {e.skills.slice(0, 4).map(s => <Badge key={s}>{s}</Badge>)}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-slate-500"><span className="font-semibold text-slate-900 dark:text-white">{e.completed}</span> {t("em.completed")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">{t("common.save")}</Button>
                    <Button size="sm" onClick={() => setPage("profile")} icon={<IconArrow width={14} height={14} />}>{t("common.viewProfile")}</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-1">
            {[1, 2, 3, "…", 12].map((p, i) => (
              <button key={i} className={cn("h-9 min-w-9 px-3 rounded-lg text-sm font-medium border", p === 1 ? "bg-electric-500 text-white border-electric-500" : "border-slate-200 dark:border-slate-800 hover:border-electric-500/50")}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 first:border-t-0 first:pt-0 first:mt-4">
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{title}</p>
    <div className="space-y-2">{children}</div>
  </div>
);

const Check = ({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-electric-600">
    <input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-electric-500 focus:ring-electric-500" />
    {label}
  </label>
);

const Range = () => (
  <div>
    <div className="flex justify-between text-xs text-slate-500 mb-2"><span>$20</span><span>$200/hr</span></div>
    <input type="range" min="20" max="200" defaultValue="80" className="w-full accent-electric-500" />
  </div>
);
