"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/UI";
import { IconBriefcase } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import { useProjects, useProject } from "../hooks/useProjects";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectListPanel } from "./ProjectListPanel";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { PostProjectModal } from "./PostProjectModal";

export default function ProjectMarketplace() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [budget, setBudget] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [activeDisc, setActiveDisc] = useState("All");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [postOpen, setPostOpen] = useState(false);

  const { data: allProjects, loading, error, refetch } = useProjects();

  const projects = allProjects ?? [];
  const firstId = projects[0]?.id ?? null;
  const effectiveSelected = selectedId ?? firstId;

  const {
    data: selectedProject,
    loading: detailLoading,
    refetch: refetchDetail,
  } = useProject(effectiveSelected);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (
        search &&
        !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;

      if (budget) {
        const [min, max] = budget.split("-").map(Number);
        if (p.budget < min || p.budget > max) return false;
      }

      if (serviceType && p.serviceType !== serviceType) return false;
      if (activeDisc !== "All" && p.serviceType !== activeDisc) return false;

      return true;
    });
  }, [projects, search, budget, serviceType, activeDisc]);

  const handleSelect = useCallback((id: number) => setSelectedId(id), []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;

    if (!user) {
      router.replace("/login?next=/projects?create=1");
      return;
    }
    if (user.role === "CLIENT") {
      setPostOpen(true);
    }
    router.replace("/projects", { scroll: false });
  }, [searchParams, user, router]);

  const handlePostClick = () => {
    if (!user) {
      router.push("/login?next=/projects?create=1");
      return;
    }
    if (user.role !== "CLIENT") return;
    setPostOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    refetchDetail();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t("pm.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {user?.role === "CLIENT" && (
            <Button
              icon={<IconBriefcase width={16} height={16} />}
              onClick={handlePostClick}
            >
              {t("common.postProject")}
            </Button>
          )}
        </div>
      </div>

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

      {!loading && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900 dark:text-white">
            {filtered.length}
          </span>{" "}
          {t("em.matched")}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <ProjectListPanel
          projects={filtered}
          loading={loading}
          error={error}
          selectedId={effectiveSelected}
          onSelect={handleSelect}
        />

        <div className="lg:sticky lg:top-20 h-fit">
          <ProjectDetailPanel
            project={selectedProject ?? null}
            loading={detailLoading && !!effectiveSelected}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <PostProjectModal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onCreated={handleRefresh}
      />
    </div>
  );
}
