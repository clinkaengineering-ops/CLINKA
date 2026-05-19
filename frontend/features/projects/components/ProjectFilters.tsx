"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Card } from "../../../components/UI";
import {
  IconArrow,
  IconBolt,
  IconBriefcase,
  IconClock,
  IconLocation,
  IconSearch,
  IconStar,
  IconWallet,
} from "../../../components/Icons";
import { useI18n } from "../../../i18n";
import { cn } from "../../../utils/cn";
import { useProjects } from "../hooks/useProjects";
import type { Project, ServiceType } from "../api/project.api";

interface ProjectFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  budget: string;
  onBudget: (v: string) => void;
  serviceType: string;
  onServiceType: (v: string) => void;
  activeDisc: string;
  onDisc: (v: string) => void;
}

export function ProjectFilters({
  search,
  onSearch,
  budget,
  onBudget,
  serviceType,
  onServiceType,
  activeDisc,
  onDisc,
}: ProjectFiltersProps) {
  const { t } = useI18n();

  const discs = [
    { id: "All", label: t("disc.all") },
    { id: "DESIGN", label: t("disc.structural") }, // maps to DESIGN service type
    { id: "SUPERVISION", label: t("disc.civil") }, // maps to SUPERVISION
    { id: "REVIEW", label: t("disc.architecture") }, // maps to REVIEW
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* keyword search */}
        <div className="flex-1 relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("pm.searchKeyword")}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          />
        </div>

        {/* budget filter */}
        <select
          value={budget}
          onChange={(e) => onBudget(e.target.value)}
          className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm"
        >
          <option value="">{t("pm.anyBudget")}</option>
          <option value="0-5000">$0 – $5k</option>
          <option value="5000-15000">$5k – $15k</option>
          <option value="15000-999999">$15k+</option>
        </select>

        {/* service type filter */}
        <select
          value={serviceType}
          onChange={(e) => onServiceType(e.target.value)}
          className="h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm"
        >
          <option value="">{t("pm.anyTimeline")}</option>
          <option value="DESIGN">Design</option>
          <option value="SUPERVISION">Supervision</option>
          <option value="REVIEW">Review</option>
        </select>
      </div>

      {/* discipline tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {discs.map((d) => (
          <button
            key={d.id}
            onClick={() => onDisc(d.id)}
            className={cn(
              "px-3.5 h-8 rounded-full text-xs font-semibold border transition",
              activeDisc === d.id
                ? "bg-electric-500 text-white border-electric-500"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:text-electric-600 hover:border-electric-500/40",
            )}
          >
            {d.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
