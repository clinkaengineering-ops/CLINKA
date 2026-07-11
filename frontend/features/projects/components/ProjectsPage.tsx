"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card } from "@/components/UI";
import { IconFilter, IconSearch, IconBriefcase, IconArrow } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { useProjects } from "../hooks/useProjects";
import { PostProjectModal } from "./PostProjectModal";
import { Badge } from "@/components/UI";
import type { ServiceType } from "../api/project.api";

const categories = ["All", "DESIGN", "SUPERVISION", "REVIEW"] as const;

export function ProjectsPage() {
  const { t } = useI18n();

  const serviceLabel = (service: string) => {
    const map: Record<string, string> = {
      DESIGN: t("service.design"),
      SUPERVISION: t("service.supervision"),
      REVIEW: t("service.review"),
    };
    return map[service] ?? service;
  };

  const categoryLabel = (cat: (typeof categories)[number]) => {
    if (cat === "All") return t("service.all");
    return serviceLabel(cat);
  };
  const { data: allProjects, loading, error, refetch } = useProjects();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projects = allProjects ?? [];

  const initialDraft = useMemo(() => {
    const create = searchParams.get("create");
    if (create !== "1") return null;
    const title = searchParams.get("title") ?? undefined;
    const description = searchParams.get("description") ?? undefined;
    const budget = searchParams.get("budget") ?? undefined;
    const serviceType = searchParams.get("service") as ServiceType | null;
    const normalizedService =
      serviceType === "DESIGN" || serviceType === "SUPERVISION" || serviceType === "REVIEW"
        ? serviceType
        : undefined;
    return { title, description, budget, serviceType: normalizedService };
  }, [searchParams]);

  useEffect(() => {
    if (!initialDraft) return;
    setIsModalOpen(true);
  }, [initialDraft]);

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = active === "All" || p.serviceType === active;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PostProjectModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => refetch()}
        initialTitle={initialDraft?.title}
        initialDescription={initialDraft?.description}
        initialBudget={initialDraft?.budget}
        initialServiceType={initialDraft?.serviceType}
      />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1>
          <p className="mt-1 text-slate-500">{t("pm.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>{t("common.postProject")}</Button>
          <Button variant="secondary" icon={<IconFilter width={16} height={16} />}>
            {t("common.filters")}
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder={t("pm.searchProjects")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={cn(
                "px-3.5 h-8 rounded-full text-xs font-semibold border transition",
                active === c
                  ? "bg-electric-500 text-white border-electric-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-electric-500/40"
              )}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-rose-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">{t("pm.noProjectsFound")}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="p-5 hover:border-electric-500/40 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold">{p.title}</h3>
                    <Badge color="blue">{serviceLabel(p.serviceType)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{formatMoney(p.budget)}</span>
                    <span>·</span>
                    <span>{p._count?.bids ?? 0} {t("common.bids")}</span>
                    <span>·</span>
                    <span>{t("common.posted")} {new Date(p.createdAt).toLocaleDateString()}</span>
                    {p.client && (
                      <>
                        <span>·</span>
                        <span>{t("pm.postedBy")} {p.client.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}