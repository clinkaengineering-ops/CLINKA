"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";
import { Button, Card } from "@/components/UI";
import { IconShield, IconWallet, IconCube, IconLayers } from "@/components/Icons";

export function AboutPage() {
  const { t } = useI18n();

  const pillars = [
    {
      title: t("about.pillar1.title"),
      desc: t("about.pillar1.desc"),
      Icon: IconShield,
      colorClass: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      title: t("about.pillar2.title"),
      desc: t("about.pillar2.desc"),
      Icon: IconWallet,
      colorClass: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: t("about.pillar3.title"),
      desc: t("about.pillar3.desc"),
      Icon: IconCube,
      colorClass: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: t("about.pillar4.title"),
      desc: t("about.pillar4.desc"),
      Icon: IconLayers,
      colorClass: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero Header */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/85">
        <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-40" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-brand-teal/10 via-brand-copper/5 to-transparent blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-transform duration-300 hover:scale-105">
            <BrandLogo variant="stacked" className="w-32 sm:w-40" priority />
          </div>
          
          <h1 className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight">
            CLINKA
          </h1>
          
          <p className="mt-4 text-lg sm:text-xl md:text-3xl font-bold bg-gradient-to-r from-brand-teal via-brand-teal to-brand-copper bg-clip-text text-transparent max-w-2xl leading-tight">
            {t("about.tagline")}
          </p>
          
          <p className="mt-8 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed font-normal">
            {t("about.description")}
          </p>
        </div>
      </section>

      {/* Rationale / Value Pillars */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            {t("about.whyTitle")}
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            {t("about.whySubtitle")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {pillars.map((p, i) => {
            const IconComp = p.Icon;
            return (
              <Card 
                key={i} 
                className="p-8 bg-white/50 backdrop-blur dark:bg-slate-900/50 hover:border-brand-teal/30 hover:shadow-xl hover:shadow-brand-teal/5 hover:scale-[1.01] transition-all duration-300 group border-slate-200/80 dark:border-slate-800/85"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${p.colorClass} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <IconComp className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white transition-colors duration-200 group-hover:text-brand-teal dark:group-hover:text-electric-300">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {p.desc}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Call To Action */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950 p-8 sm:p-12 lg:p-16 text-white border-none shadow-xl shadow-brand-teal/10">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute -end-20 -top-20 h-80 w-80 bg-brand-copper/30 blur-[100px] rounded-full" />
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center md:text-start">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-4 text-white/80 text-base sm:text-lg">
                {t("about.ctaDesc")}
              </p>
            </div>
            
            <div className="shrink-0">
              <Link href="/projects">
                <Button 
                  size="lg" 
                  className="!bg-white !text-brand-teal hover:!bg-brand-ice hover:!scale-105 active:!scale-95 transition-all duration-200 shadow-md font-semibold border-none"
                >
                  {t("about.ctaBtn")}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
