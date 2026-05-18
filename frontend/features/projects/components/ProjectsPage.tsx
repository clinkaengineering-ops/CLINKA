"use client";
import { useState } from "react";
import { Badge, Button, Card } from "@/components/UI";
import { IconSearch, IconFilter, IconBriefcase, IconArrow } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";

const mockProjects = [
  { id: "p1", title: "12-Story Mixed-Use Tower — Structural Design", category: "Structural", budget: "$18,000 – $25,000", timeline: "10 weeks", bids: 14, posted: "2h ago", client: "Meridian Developments", featured: true },
  { id: "p2", title: "Hospital Wing — Full MEP BIM Coordination", category: "MEP / BIM", budget: "$32,000 fixed", timeline: "16 weeks", bids: 22, posted: "5h ago", client: "St. Vincent Healthcare" },
  { id: "p3", title: "Boutique Hotel — Architectural Concept", category: "Architecture", budget: "$8,000 – $14,000", timeline: "6 weeks", bids: 9, posted: "1d ago", client: "Aurora Hospitality" },
  { id: "p4", title: "Residential Subdivision — Civil Site & Drainage", category: "Civil", budget: "$11,000 – $16,000", timeline: "8 weeks", bids: 17, posted: "1d ago", client: "Greenfield Estates" },
];

const categories = ["All", "Structural", "Architecture", "MEP / BIM", "Civil"];

export function ProjectsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("All");
  const filtered = mockProjects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = active === "All" || p.category === active;
    return matchSearch && matchCat;
  });
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1><p className="mt-1 text-slate-500">{t("pm.subtitle")}</p></div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<IconFilter width={16} height={16} />}>{t("common.filters")}</Button>
          <Button icon={<IconBriefcase width={16} height={16} />}>Post Project</Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="relative"><IconSearch width={16} height={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder={t("pm.searchProjects")} value={search} onChange={e => setSearch(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30" /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map(c => (<button key={c} onClick={() => setActive(c)} className={cn("px-3.5 h-8 rounded-full text-xs font-semibold border transition", active === c ? "bg-electric-500 text-white border-electric-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-electric-500/40")}>{c}</button>))}
        </div>
      </Card>
      <div className="space-y-4">
        {filtered.map(p => (
          <Card key={p.id} className={cn("p-5 hover:border-electric-500/40 hover:shadow-lg transition", p.featured && "ring-1 ring-electric-500/30")}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold">{p.title}</h3>{p.featured && <Badge color="electric">Featured</Badge>}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span>{p.category}</span><span>·</span><span>{p.budget}</span><span>·</span><span>{p.timeline}</span><span>·</span><span>{p.bids} bids</span><span>·</span><span>Posted {p.posted}</span></div>
                <p className="mt-1 text-xs text-slate-400">by {p.client}</p>
              </div>
              <Button size="sm" icon={<IconArrow width={14} height={14} />}>View Project</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
