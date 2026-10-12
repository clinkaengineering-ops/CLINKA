"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/UI";
import { Pagination } from "@/components/Pagination";
import { IconSearch } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useEngineers } from "../hooks/useEngineers";
import { EngineerCard } from "./EngineerCard";
import { EngineerCardSkeleton } from "./EngineerCardSkeleton";
import { ENGINEERS_PAGE_SIZE, parsePageParam } from "@/utils/pagination";

const GRID_CLASS = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function EngineersList() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const specialtyParam = searchParams.get("specialty");
  const specialty =
    specialtyParam === "CIVIL" || specialtyParam === "ARCHITECTURAL"
      ? specialtyParam
      : "All";
  const nationality = searchParams.get("nationality") ?? "All";
  const page = parsePageParam(searchParams.get("page"));

  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    setSearchInput((prev) => {
      if (prev === q) return prev;
      if (prev.startsWith(q) && debouncedSearch === q) return prev;
      return q;
    });
  }, [q, debouncedSearch]);

  const writeParams = useCallback(
    (
      updates: Record<string, string | null>,
      mode: "replace" | "push",
      resetPage = false,
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "All") params.delete(key);
        else params.set(key, value);
      }
      if (resetPage) params.delete("page");
      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      if (href === current) return;
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === q) return;
    writeParams({ q: debouncedSearch || null }, "replace", true);
  }, [debouncedSearch, q, writeParams]);

  useEffect(() => {
    const raw = searchParams.get("page");
    if (raw === null) return;
    const parsed = parsePageParam(raw);
    if (String(parsed) === raw) return;
    writeParams({ page: parsed > 1 ? String(parsed) : null }, "replace");
  }, [searchParams, writeParams]);

  const { engineers, meta, loading, error } = useEngineers({
    q: q || undefined,
    specialty: specialty !== "All" ? specialty : undefined,
    nationality: nationality !== "All" ? nationality : undefined,
    page,
    limit: ENGINEERS_PAGE_SIZE,
  });

  useEffect(() => {
    if (loading || error) return;
    if (meta.totalPages <= 0) return;
    if (page <= meta.totalPages) return;
    writeParams(
      { page: meta.page > 1 ? String(meta.page) : null },
      "replace",
    );
  }, [loading, error, meta.page, meta.totalPages, page, writeParams]);

  const goToPage = (nextPage: number) => {
    writeParams({ page: nextPage > 1 ? String(nextPage) : null }, "push");
    const results = document.getElementById("engineers-results");
    results?.scrollIntoView({ block: "start" });
  };

  const from =
    meta.totalCount === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.totalCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("em.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("em.subtitle")}</p>
      </div>

      <Card className="p-5">
        <div className="relative">
          <IconSearch
            width={16}
            height={16}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            placeholder={t("em.searchByName")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-11 ps-10 pe-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
            aria-label={t("em.searchByName")}
          />
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
          <div className="flex flex-col w-full sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {t("em.specialty")}
            </label>
            <select
              value={specialty}
              onChange={(e) =>
                writeParams({ specialty: e.target.value }, "replace", true)
              }
              className="h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500/30 cursor-pointer"
            >
              <option value="All">{t("em.allSpecialties")}</option>
              <option value="CIVIL">{t("em.civil")}</option>
              <option value="ARCHITECTURAL">{t("em.architectural")}</option>
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px] sm:flex-1 lg:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {t("em.nationality")}
            </label>
            <select
              value={nationality}
              onChange={(e) =>
                writeParams({ nationality: e.target.value }, "replace", true)
              }
              className="h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500/30 cursor-pointer"
            >
              <option value="All">{t("em.allNationalities")}</option>
              {[
                "Afghan",
                "Albanian",
                "Algerian",
                "Argentine",
                "Armenian",
                "Australian",
                "Austrian",
                "Azerbaijani",
                "Bangladeshi",
                "Belarusian",
                "Belgian",
                "Bolivian",
                "Bosnian",
                "Brazilian",
                "British",
                "Bulgarian",
                "Cambodian",
                "Cameroonian",
                "Canadian",
                "Chilean",
                "Chinese",
                "Colombian",
                "Congolese",
                "Croatian",
                "Cuban",
                "Czech",
                "Danish",
                "Dutch",
                "Ecuadorian",
                "Egyptian",
                "Emirati",
                "English",
                "Estonian",
                "Ethiopian",
                "Finnish",
                "French",
                "Georgian",
                "German",
                "Ghanaian",
                "Greek",
                "Guatemalan",
                "Hungarian",
                "Indian",
                "Indonesian",
                "Iranian",
                "Iraqi",
                "Irish",
                "Israeli",
                "Italian",
                "Jamaican",
                "Japanese",
                "Jordanian",
                "Kazakh",
                "Kenyan",
                "Kuwaiti",
                "Lebanese",
                "Libyan",
                "Lithuanian",
                "Malaysian",
                "Mexican",
                "Mongolian",
                "Moroccan",
                "Nepalese",
                "New Zealander",
                "Nigerian",
                "Norwegian",
                "Omani",
                "Pakistani",
                "Palestinian",
                "Peruvian",
                "Philippine",
                "Polish",
                "Portuguese",
                "Qatari",
                "Romanian",
                "Russian",
                "Saudi",
                "Scottish",
                "Serbian",
                "Singaporean",
                "Slovak",
                "Slovenian",
                "Somali",
                "South African",
                "South Korean",
                "Spanish",
                "Sri Lankan",
                "Sudanese",
                "Swedish",
                "Swiss",
                "Syrian",
                "Taiwanese",
                "Tanzanian",
                "Thai",
                "Tunisian",
                "Turkish",
                "Ukrainian",
                "Uruguayan",
                "American",
                "Uzbek",
                "Venezuelan",
                "Vietnamese",
                "Yemeni",
                "Zimbabwean",
                "Other",
              ].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <div
        id="engineers-results"
        className="min-h-[28rem] space-y-5 scroll-mt-4"
        aria-busy={loading}
      >
        {!loading && !error && meta.totalCount > 0 && (
          <p className="text-sm text-slate-500">
            {t("em.showingResults", { from, to, total: meta.totalCount })}
          </p>
        )}

        {loading ? (
          <div className={GRID_CLASS}>
            {Array.from({ length: ENGINEERS_PAGE_SIZE }).map((_, i) => (
              <EngineerCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-rose-500" role="alert">
            {error}
          </div>
        ) : engineers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">{t("em.noEngineers")}</div>
        ) : (
          <div className={GRID_CLASS}>
            {engineers.map((e) => (
              <EngineerCard key={e.id} engineer={e} />
            ))}
          </div>
        )}

        <Pagination
          page={loading ? page : meta.page || page}
          totalPages={meta.totalPages}
          onPageChange={goToPage}
          disabled={loading}
        />
      </div>
    </div>
  );
}
