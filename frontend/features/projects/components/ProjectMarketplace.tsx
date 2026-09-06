"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/UI";
import { IconBriefcase } from "@/components/Icons";
import { useI18n } from "@/i18n";
import useAuthStore from "@/store/authStore";
import {
  useProjects,
  useProject,
  useMyProjects,
  useAssignedProjects,
} from "../hooks/useProjects";
import { ProjectFilters } from "./ProjectFilters";
import { ProjectListPanel } from "./ProjectListPanel";
import { ProjectDetailPanel } from "./ProjectDetailPanel";
import { PostProjectModal } from "./PostProjectModal";
import { matchesBudget, matchesPostedTimeline } from "../utils/projectFilters";
import type { ServiceType } from "../api/project.api";

export default function ProjectMarketplace() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [postOpen, setPostOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"browse" | "mine" | "contracts">(
    "browse",
  );

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";
  const urlQ = searchParams.get("q") ?? "";
  const { data: allProjects, loading, error, refetch } = useProjects(
    viewMode === "browse"
      ? {
        q: search || urlQ || undefined,
        serviceType: (serviceType as ServiceType) || undefined,
      }
      : undefined,
  );
  const {
    data: myProjects,
    loading: myLoading,
    error: myError,
    refetch: refetchMy,
  } = useMyProjects(isClient);
  const {
    data: assignedProjects,
    loading: assignedLoading,
    error: assignedError,
    refetch: refetchAssigned,
  } = useAssignedProjects(isEngineer);

  const projects =
    viewMode === "mine" && isClient
      ? (myProjects ?? [])
      : viewMode === "contracts" && isEngineer
        ? (assignedProjects ?? [])
        : (allProjects ?? []);
  const listLoading =
    viewMode === "mine" && isClient
      ? myLoading
      : viewMode === "contracts" && isEngineer
        ? assignedLoading
        : loading;
  const listError =
    viewMode === "mine" && isClient
      ? myError
      : viewMode === "contracts" && isEngineer
        ? assignedError
        : error;
  const firstId = projects[0]?.id ?? null;
  // On mobile, only use the explicitly selected ID so the modal doesn't open automatically
  const effectiveSelected = isMobile ? selectedId : (selectedId ?? firstId);

  const {
    data: selectedProject,
    loading: detailLoading,
    error: detailError,
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

      if (!matchesBudget(p.budget, budget)) return false;
      if (!matchesPostedTimeline(p.createdAt, timeline)) return false;
      if (serviceType && p.serviceType !== serviceType) return false;

      return true;
    });
  }, [projects, search, budget, timeline, serviceType]);

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

  const handleSelect = useCallback((id: number | null) => setSelectedId(id), []);

  useEffect(() => {
    if (searchParams.get("view") === "mine" && isClient) {
      setViewMode("mine");
    }
    if (searchParams.get("view") === "contracts" && isEngineer) {
      setViewMode("contracts");
    }

    const idParam = searchParams.get("id");
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        setSelectedId(id);
        if (isClient) setViewMode("mine");
      }
    }

    if (initialDraft) {
      if (!user) {
        router.replace("/login?next=/projects?create=1");
        return;
      }
      if (user.role === "ADMIN") {
        router.replace("/projects", { scroll: false });
        return;
      }
      if (user.role === "CLIENT") {
        setPostOpen(true);
        setViewMode("mine");
      }
      router.replace("/projects", { scroll: false });
    }
  }, [searchParams, user, router, isClient, initialDraft]);

  const handlePostClick = () => {
    if (!user) {
      router.push("/login?next=/projects?create=1");
      return;
    }
    if (user.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (user.role !== "CLIENT") return;
    setPostOpen(true);
  };

  const handleRefresh = () => {
    refetch();
    if (isClient) refetchMy();
    if (isEngineer) refetchAssigned();
    refetchDetail();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("pm.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{t("pm.subtitle")}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isClient && (
            <>
              <Button
                variant={viewMode === "browse" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("browse")}
              >
                {t("pm.browse")}
              </Button>
              <Button
                variant={viewMode === "mine" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("mine")}
              >
                {t("pm.myProjects")}
              </Button>
              <Button
                icon={<IconBriefcase width={16} height={16} />}
                onClick={handlePostClick}
              >
                {t("common.postProject")}
              </Button>
            </>
          )}
          {isEngineer && (
            <>
              <Button
                variant={viewMode === "browse" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("browse")}
              >
                {t("pm.browse")}
              </Button>
              <Button
                variant={viewMode === "contracts" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setViewMode("contracts")}
              >
                {t("pm.myContracts")}
              </Button>
            </>
          )}
        </div>
      </div>

      <ProjectFilters
        search={search}
        onSearch={setSearch}
        budget={budget}
        onBudget={setBudget}
        timeline={timeline}
        onTimeline={setTimeline}
        serviceType={serviceType}
        onServiceType={setServiceType}
      />

      {!listLoading && (
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900 dark:text-white">
            {filtered.length}
          </span>{" "}
          {t("em.matched")}
        </p>
      )}

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 min-w-0 w-full">
        <ProjectListPanel
          projects={filtered}
          loading={listLoading}
          error={listError}
          selectedId={effectiveSelected}
          onSelect={handleSelect}
        />

        {!isMobile && (
          <div className="lg:sticky lg:top-20 h-fit min-w-0 w-full hidden lg:block">
            <ProjectDetailPanel
              project={selectedProject ?? null}
              loading={(detailLoading && !!effectiveSelected) || listLoading}
              error={detailError}
              onRefresh={handleRefresh}
            />
          </div>
        )}
      </div>

      {isMobile && effectiveSelected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 lg:hidden">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Close button positioned absolutely outside the scrolling area */}
            <button
              onClick={() => handleSelect(null)}
              className="absolute -top-3 -right-3 z-[60] p-2 text-slate-600 hover:text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-300 shadow-lg rounded-full border border-slate-200 dark:border-slate-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            {/* Scrolling container for the ProjectDetailPanel */}
            <div className="overflow-y-auto rounded-xl w-full h-full shadow-2xl bg-white dark:bg-slate-900">
              <ProjectDetailPanel
                project={selectedProject ?? null}
                loading={(detailLoading && !!effectiveSelected) || listLoading}
                error={detailError}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      )}

      <PostProjectModal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        onCreated={handleRefresh}
        initialTitle={initialDraft?.title}
        initialDescription={initialDraft?.description}
        initialBudget={initialDraft?.budget}
        initialServiceType={initialDraft?.serviceType}
      />
    </div>
  );
}
