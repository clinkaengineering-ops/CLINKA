"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import enDict from "./en.json";
import arDict from "./ar.json";

export type Lang = "en" | "ar";
type Dict = Record<string, string>;

const dicts: Record<Lang, Dict> = {
  en: enDict as Dict,
  ar: arDict as Dict,
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, params?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
};

const I18nCtx = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

const LANG_KEY = "clinka.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === "en" || stored === "ar") setLangState(stored);
    setHydrated(true);
  }, []);

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang, dir, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: setLangState,
      dir,
      t: (k: string, params?: Record<string, string | number>) => {
        let str = dicts[lang][k] ?? dicts.en[k] ?? k;
        if (params) {
          for (const [key, value] of Object.entries(params)) {
            str = str.replace(new RegExp(`{${key}}`, "g"), String(value));
          }
        }
        return str;
      },
    }),
    [lang, dir],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
