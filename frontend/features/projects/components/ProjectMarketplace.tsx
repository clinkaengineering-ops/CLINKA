"use client";

import { useCallback, useMemo, useState } from "react";
import {  Button } from "../../../components/UI";
import {
  IconBriefcase,
} from "../../../components/Icons";
import { useI18n } from "../../../i18n";
import { useProjects } from "../hooks/useProjects";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectListPanel } from "./ProjectListPanel";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
export default function ProjectMarketplace() {
  const { t } = useI18n();

  // Filters state
  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [activeDisc, setActiveDisc] = useState("All");

  // Selected project
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Fetch all projects
  const { data: allProjects, loading, error, refetch } = useProjects();

  // Auto-select first project when list loads
  const projects = allProjects ?? [];
  const firstId = projects[0]?.id ?? null;
  const effectiveSelected = selectedId ?? firstId;

  // Client-side filtering
  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.description.toLowerCase().includes(search.toLowerCase())) return false;

      if (budget) {
        const [min, max] = budget.split("-").map(Number);
        if (p.budget < min || p.budget > max) return false;
      }

      if (serviceType && p.serviceType !== serviceType) return false;

      if (activeDisc !== "All" && p.serviceType !== activeDisc) return false;

      return true;
    });
  }, [projects, search, budget, serviceType, activeDisc]);

  const selectedProject = filtered.find(p => p.id === effectiveSelected) ?? filtered[0] ?? null;

  const handleSelect = useCallback((id: number) => setSelectedId(id), []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t("pm.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t("pm.saved")}</Button>
          <Button icon={<IconBriefcase width={16} height={16} />}>
            {t("common.postProject")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ProjectFilters
        search={search}
        onSearch={setSearch}
        budget={budget}
        onBudget={setBudget}
        serviceType={serviceType}
        onServiceType={setServiceType}
        activeDisc={activeDisc}
        onDisc={setActiveDisc}
      />

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
          {t("em.matched")}
        </p>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Left: list */}
        <ProjectListPanel
          projects={filtered}
          loading={loading}
          error={error}
          selectedId={effectiveSelected}
          onSelect={handleSelect}
        />

        {/* Right: detail */}
        <div className="lg:sticky lg:top-20 h-fit">
          <ProjectDetailPanel
            project={selectedProject}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
