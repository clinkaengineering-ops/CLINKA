"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/UI";
import { IconSearch } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useEngineers } from "../hooks/useEngineers";
import { EngineerCard } from "./EngineerCard";
import { EngineerCardSkeleton } from "./EngineerCardSkeleton";

export function EngineersList() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [activeNationality, setActiveNationality] = useState("All");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  const [active, setActive] = useState("All");
  const { engineers, loading, error } = useEngineers({
    q: search || undefined,
    specialty: active !== "All" ? active : undefined,
    nationality: activeNationality !== "All" ? activeNationality : undefined,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("em.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("em.subtitle")}</p>
      </div>

      {/* Search + inline dropdown filters */}
      <Card className="p-5">
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

        <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
          <div className="flex flex-col w-full sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Specialty
            </label>
            <select
              value={active}
              onChange={(e) => setActive(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500/30 cursor-pointer"
            >
              <option value="All">All Specialties</option>
              <option value="CIVIL">Civil</option>
              <option value="ARCHITECTURAL">Architectural</option>
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto sm:min-w-[200px] sm:flex-1 lg:flex-none">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nationality
            </label>
            <select
              value={activeNationality}
              onChange={(e) => setActiveNationality(e.target.value)}
              className="h-10 w-full px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-electric-500/30 cursor-pointer"
            >
              <option value="All">All Nationalities</option>
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

      {/* Results */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <EngineerCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-rose-500">{error}</div>
      ) : engineers.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No engineers found</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {engineers.map((e) => <EngineerCard key={e.id} engineer={e} />)}
        </div>
      )}
    </div>
  );
}