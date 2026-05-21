// features/users/components/EngineersPage.tsx
"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/UI";
import { IconFilter } from "@/components/Icons";
import { IconSearch } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import { useEngineers } from "../hooks/useEngineers";
import { EngineerCard } from "./EngineerCard";
import { EngineerCardSkeleton } from "./EngineerCardSkeleton";

const DISCIPLINES = [
  { id: "All", labelKey: "disc.all" },
  { id: "CIVIL", labelKey: "disc.civil" },
  { id: "ARCHITECTURAL", labelKey: "disc.architecture" },
] as const;

export function EngineersList() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);
  const [active, setActive] = useState("All");
  const { engineers, loading, error } = useEngineers({
    q: search || undefined,
    specialty: active !== "All" ? active : undefined,
  });

  const filtered = engineers;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("em.title")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {t("em.subtitle")}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<IconFilter width={16} height={16} />}
        >
          {t("common.filters")}
        </Button>
      </div>

      {/* Search + discipline filters */}
      <Card className="p-4">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder={t("em.searchByName")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DISCIPLINES.map((d) => (
            <button
              key={d.id}
              onClick={() => setActive(d.id)}
              className={cn(
                "px-3.5 h-8 rounded-full text-xs font-semibold border transition",
                active === d.id
                  ? "bg-electric-500 text-white border-electric-500 shadow-md shadow-electric-500/30"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-electric-500/40"
              )}
            >
              {t(d.labelKey)}
            </button>
          ))}
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <EngineerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-rose-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No engineers found
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtered.map((e) => (
            <EngineerCard key={e.id} engineer={e} />
          ))}
        </div>
      )}
    </div>
  );
}
