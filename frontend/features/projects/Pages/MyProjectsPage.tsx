"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconBriefcase, IconSearch, IconChart, IconStar, IconWallet } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import useAuthStore from "@/store/authStore";
import { useMyProjects } from "../hooks/useProjects";
import { useMyBids } from "@/features/bids/hooks/useMyBids";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import {
  STATUS_COLORS,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "../utils/projectStatus";
import type { Project } from "../api/project.api";
import type { MyBid } from "@/features/bids/api/bids.api";

/* ── Helpers ─────────────────────────────────────────────────────────── */

const SERVICE_LABELS: Record<string, string> = {
  DESIGN: "Design",
  SUPERVISION: "Supervision",
  REVIEW: "Review",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ── Shared filter pills ─────────────────────────────────────────────── */

interface StatusTab {
  key: string;
  label: string;
}

function StatusPills({
  tabs,
  active,
  onChange,
}: {
  tabs: StatusTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-3.5 h-8 rounded-full text-xs font-semibold border transition-all",
            active === tab.key
              ? "bg-electric-500 text-white border-electric-500 shadow-sm shadow-electric-500/25"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-electric-500/40 hover:text-electric-600"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ── Client View ─────────────────────────────────────────────────────── */

function ClientMyProjects() {
  const { t } = useI18n();
  const router = useRouter();
  const { data: projects, loading, error, refetch } = useMyProjects(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const allProjects = projects ?? [];

  const statusTabs: StatusTab[] = [
    { key: "ALL", label: t("mp.allStatuses") },
    { key: "OPEN", label: t("proj.status.open") },
    { key: "IN_PROGRESS", label: t("proj.status.inProgress") },
    { key: "AWAITING_APPROVAL", label: t("proj.status.submitted") },
    { key: "REVISION_REQUESTED", label: t("proj.status.revision") },
    { key: "COMPLETED", label: t("proj.status.completed") },
    { key: "CANCELLED", label: t("proj.status.cancelled") },
  ];

  const filtered = useMemo(() => {
    return allProjects.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allProjects, statusFilter, search]);

  const stats = useMemo(() => {
    const active = allProjects.filter(
      (p) => !["COMPLETED", "CANCELLED", "CLOSED"].includes(p.status)
    ).length;
    const completed = allProjects.filter((p) => p.status === "COMPLETED").length;
    const totalValue = allProjects.reduce((sum, p) => {
      const accepted = p.bids?.find((b) => b.status === "ACCEPTED");
      return sum + Number(accepted?.price ?? p.budget);
    }, 0);
    return { total: allProjects.length, active, completed, totalValue };
  }, [allProjects]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("mp.totalProjects")}
          value={String(stats.total)}
          accent="up"
          icon={<IconBriefcase width={20} height={20} />}
        />
        <StatCard
          label={t("mp.activeProjects")}
          value={String(stats.active)}
          accent="up"
          icon={<IconChart width={20} height={20} />}
        />
        <StatCard
          label={t("mp.completedProjects")}
          value={String(stats.completed)}
          accent="up"
          icon={<IconStar width={20} height={20} />}
        />
        <StatCard
          label={t("mp.totalValue")}
          value={formatMoney(stats.totalValue)}
          accent="up"
          icon={<IconWallet width={20} height={20} />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder={t("mp.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          />
        </div>
        <StatusPills tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
      </Card>

      {/* Count */}
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "project" : "projects"}
      </p>

      {/* List */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 flex justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={refetch}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-electric-500/10 flex items-center justify-center mb-4">
            <IconBriefcase width={28} height={28} className="text-electric-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {t("mp.noProjects")}
          </p>
          <p className="text-sm text-slate-500 mt-1">{t("mp.noProjectsDesc")}</p>
          <Button className="mt-6" onClick={() => router.push("/projects?create=1")}>
            {t("mp.postFirst")}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((project) => (
          <ClientProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
}

function ClientProjectCard({ project }: { project: Project }) {
  const { t } = useI18n();
  const statusColor = STATUS_COLORS[project.status] ?? "slate";
  const statusLabel = STATUS_LABEL_KEYS[project.status]
    ? t(STATUS_LABEL_KEYS[project.status])
    : project.status;
  const acceptedBid = project.bids?.find((b) => b.status === "ACCEPTED");
  const serviceLabel = SERVICE_LABELS[project.serviceType] ?? project.serviceType;

  return (
    <Link href={`/projects?id=${project.id}&view=mine`}>
      <Card className="p-5 hover:border-electric-500/40 hover:shadow-lg transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-electric-600 transition-colors">
                {project.title}
              </h3>
              <Badge color={statusColor}>{statusLabel}</Badge>
              <Badge>{serviceLabel}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {project.description}
            </p>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white shrink-0">
            {formatMoney(acceptedBid?.price ?? project.budget)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {acceptedBid && (
            <span>
              {t("mp.engineer")}: <strong className="text-slate-700 dark:text-slate-300">{acceptedBid.engineer.user.name}</strong>
            </span>
          )}
          <span>{project._count?.bids ?? project.bids?.length ?? 0} {t("common.bids")}</span>
          <span className="ms-auto">{relativeTime(project.updatedAt)}</span>
        </div>
      </Card>
    </Link>
  );
}

/* ── Engineer View ───────────────────────────────────────────────────── */

function EngineerMyProjects() {
  const { t } = useI18n();
  const router = useRouter();
  const { bids, loading, error, refetch } = useMyBids();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const statusTabs: StatusTab[] = [
    { key: "ALL", label: t("mp.allStatuses") },
    { key: "PENDING", label: t("mp.pending") },
    { key: "ACCEPTED", label: t("mp.accepted") },
    { key: "REJECTED", label: t("mp.rejected") },
  ];

  const filtered = useMemo(() => {
    return bids.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search && !b.project.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bids, statusFilter, search]);

  const stats = useMemo(() => {
    const pending = bids.filter((b) => b.status === "PENDING").length;
    const accepted = bids.filter((b) => b.status === "ACCEPTED").length;
    const completed = bids.filter(
      (b) => b.status === "ACCEPTED" && b.project.status === "COMPLETED"
    ).length;
    const totalValue = bids
      .filter((b) => b.status === "ACCEPTED")
      .reduce((sum, b) => sum + Number(b.price), 0);
    return { total: bids.length, pending, accepted, completed, totalValue };
  }, [bids]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("mp.totalProjects")}
          value={String(stats.total)}
          change={`${stats.pending} pending`}
          accent="up"
          icon={<IconBriefcase width={20} height={20} />}
        />
        <StatCard
          label={t("mp.activeProjects")}
          value={String(stats.accepted)}
          change="Contracts"
          accent="up"
          icon={<IconChart width={20} height={20} />}
        />
        <StatCard
          label={t("mp.completedProjects")}
          value={String(stats.completed)}
          accent="up"
          icon={<IconStar width={20} height={20} />}
        />
        <StatCard
          label={t("mp.totalValue")}
          value={formatMoney(stats.totalValue)}
          change="From contracts"
          accent="up"
          icon={<IconWallet width={20} height={20} />}
        />
      </div>

      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder={t("mp.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          />
        </div>
        <StatusPills tabs={statusTabs} active={statusFilter} onChange={setStatusFilter} />
      </Card>

      {/* Count */}
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-900 dark:text-white">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "project" : "projects"}
      </p>

      {/* List */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 flex justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={refetch}>
            {t("common.retry")}
          </Button>
        </div>
      )}

      {!error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-electric-500/10 flex items-center justify-center mb-4">
            <IconBriefcase width={28} height={28} className="text-electric-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {t("mp.noContracts")}
          </p>
          <p className="text-sm text-slate-500 mt-1">{t("mp.noContractsDesc")}</p>
          <Button className="mt-6" onClick={() => router.push("/projects")}>
            {t("mp.browseProjects")}
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((bid) => (
          <EngineerBidCard key={bid.id} bid={bid} />
        ))}
      </div>
    </>
  );
}

const BID_STATUS_COLORS: Record<string, "amber" | "green" | "rose" | "slate"> = {
  PENDING: "amber",
  ACCEPTED: "green",
  REJECTED: "rose",
};

function EngineerBidCard({ bid }: { bid: MyBid }) {
  const { t } = useI18n();
  const bidColor = BID_STATUS_COLORS[bid.status] ?? "slate";
  const projectStatusColor = STATUS_COLORS[bid.project.status] ?? "slate";
  const projectStatusLabel = STATUS_LABEL_KEYS[bid.project.status]
    ? t(STATUS_LABEL_KEYS[bid.project.status])
    : bid.project.status;
  const serviceLabel = SERVICE_LABELS[bid.project.serviceType] ?? bid.project.serviceType;

  return (
    <Link href={`/projects?id=${bid.projectId}`}>
      <Card className="p-5 hover:border-electric-500/40 hover:shadow-lg transition-all group cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-electric-600 transition-colors">
                {bid.project.title}
              </h3>
              <Badge color={bidColor}>{bid.status}</Badge>
              {bid.status === "ACCEPTED" && (
                <Badge color={projectStatusColor}>{projectStatusLabel}</Badge>
              )}
              <Badge>{serviceLabel}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {bid.description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>
            {t("mp.bidOn")}: <strong className="text-slate-700 dark:text-slate-300">{formatMoney(bid.price)}</strong>
          </span>
          <span>
            {t("proj.budget") || "Budget"}: {formatMoney(bid.project.budget)}
          </span>
          <span>{bid.duration}</span>
          <span className="ms-auto">{relativeTime(bid.project.updatedAt)}</span>
        </div>
      </Card>
    </Link>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────── */

export function MyProjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const isClient = user?.role === "CLIENT";
  const isEngineer = user?.role === "ENGINEER";

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center text-slate-500">
        <p>{t("common.loginRequired") || "Please log in to view your projects."}</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          {t("side.signin")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEngineer ? t("mp.titleEngineer") : t("mp.title")}
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {isEngineer ? t("mp.subtitleEngineer") : t("mp.subtitle")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isClient && (
            <Button
              icon={<IconBriefcase width={16} height={16} />}
              onClick={() => router.push("/projects?create=1")}
            >
              {t("common.postProject")}
            </Button>
          )}
          {isEngineer && (
            <Button
              icon={<IconBriefcase width={16} height={16} />}
              onClick={() => router.push("/projects")}
            >
              {t("mp.browseProjects")}
            </Button>
          )}
        </div>
      </div>

      {/* Role-specific content */}
      {isClient && <ClientMyProjects />}
      {isEngineer && <EngineerMyProjects />}
    </div>
  );
}
