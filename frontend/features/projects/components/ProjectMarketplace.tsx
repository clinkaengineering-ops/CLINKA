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

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";
  const urlQ = searchParams.get("q") ?? "";
  const { data: allProjects, loading, error, refetch } = useProjects(
    viewMode === "browse"
      ? {
          q: search || urlQ || undefined,
          serviceType: serviceType || undefined,
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
  const effectiveSelected = selectedId ?? firstId;

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

  const handleSelect = useCallback((id: number) => setSelectedId(id), []);

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
    <div className="space-y-6 max-w-7xl mx-auto">
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

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <ProjectListPanel
          projects={filtered}
          loading={listLoading}
          error={listError}
          selectedId={effectiveSelected}
          onSelect={handleSelect}
        />

        <div className="lg:sticky lg:top-20 h-fit">
          <ProjectDetailPanel
            project={selectedProject ?? null}
            loading={detailLoading && !!effectiveSelected}
            error={detailError}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

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
