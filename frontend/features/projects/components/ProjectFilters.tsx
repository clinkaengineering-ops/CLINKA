"use client";

import { IconSearch } from "../../../components/Icons";
import { useI18n } from "../../../i18n";
import { Card } from "../../../components/UI";
import type { ServiceType } from "../api/project.api";

const SERVICE_TYPES: ServiceType[] = ["DESIGN", "SUPERVISION", "REVIEW"];

interface ProjectFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  budget: string;
  onBudget: (v: string) => void;
  timeline: string;
  onTimeline: (v: string) => void;
  serviceType: string;
  onServiceType: (v: string) => void;
}

export function ProjectFilters({
  search,
  onSearch,
  budget,
  onBudget,
  timeline,
  onTimeline,
  serviceType,
  onServiceType,
}: ProjectFiltersProps) {
  const { t } = useI18n();

  const serviceLabel = (type: ServiceType) => {
    const map: Record<ServiceType, string> = {
      DESIGN: t("service.design"),
      SUPERVISION: t("service.supervision"),
      REVIEW: t("service.review"),
    };
    return map[type];
  };

  const selectClass =
    "h-11 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 text-sm min-w-[9.5rem]";

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
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

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <select
            value={budget}
            onChange={(e) => onBudget(e.target.value)}
            aria-label={t("common.budget")}
            className={selectClass}
          >
            <option value="">{t("pm.anyBudget")}</option>
            <option value="0-5000">0 – 5,000 EGP</option>
            <option value="5000-15000">5,000 – 15,000 EGP</option>
            <option value="15000-999999">15,000+ EGP</option>
          </select>

          <select
            value={timeline}
            onChange={(e) => onTimeline(e.target.value)}
            aria-label={t("common.timeline")}
            className={selectClass}
          >
            <option value="">{t("pm.anyTimeline")}</option>
            <option value="under4w">{t("pm.under4w")}</option>
            <option value="1to3m">{t("pm.1to3m")}</option>
            <option value="3plus">{t("pm.3plus")}</option>
          </select>

          <select
            value={serviceType}
            onChange={(e) => onServiceType(e.target.value)}
            aria-label={t("pm.postModal.serviceType")}
            className={selectClass}
          >
            <option value="">{t("pm.anyServiceType")}</option>
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {serviceLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
