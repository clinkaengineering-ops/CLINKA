"use client";

import Link from "next/link";
import { useI18n } from "@/i18n";
import { Button, Card, Badge, SectionHeader } from "@/components/UI";
import { IconShield, IconWallet, IconCube, IconLayers, IconTrend, IconCheck, IconCompass } from "@/components/Icons";
import { cn } from "@/utils/cn";

export function AboutPage() {
  const { t } = useI18n();

  const diffItems = [
    { title: t("about.diff1Title"), desc: t("about.diff1Desc"), Icon: IconShield, color: "text-emerald-500" },
    { title: t("about.diff2Title"), desc: t("about.diff2Desc"), Icon: IconWallet, color: "text-blue-500" },
    { title: t("about.diff3Title"), desc: t("about.diff3Desc"), Icon: IconTrend, color: "text-brand-copper" },
    { title: t("about.diff4Title"), desc: t("about.diff4Desc"), Icon: IconLayers, color: "text-purple-500" },
    { title: t("about.diff5Title"), desc: t("about.diff5Desc"), Icon: IconCube, color: "text-amber-500" },
  ];

  const whoItems = [
    t("about.who1"), t("about.who2"), t("about.who3"), t("about.who4"), t("about.who5"), 
    t("about.who6"), t("about.who7"), t("about.who8"), t("about.who9")
  ];

  const howSteps = [
    { title: t("about.how1Title"), desc: t("about.how1Desc") },
    { title: t("about.how2Title"), desc: t("about.how2Desc") },
    { title: t("about.how3Title"), desc: t("about.how3Desc") },
    { title: t("about.how4Title"), desc: t("about.how4Desc") },
  ];

  const valueItems = [
    t("about.val1"), t("about.val2"), t("about.val3"), t("about.val4"), t("about.val5"), t("about.val6")
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/85">
        <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-40" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-brand-teal/10 via-brand-copper/5 to-transparent blur-3xl pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          <Badge color="electric" className="mb-6">{t("about.whatWeDo")}</Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-brand-teal via-brand-teal to-brand-copper bg-clip-text text-transparent pb-2">
            {t("about.heroTitle")}
          </h1>
          
          <div className="mt-8 space-y-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            <p>{t("about.heroDesc1")}</p>
            <p>{t("about.heroDesc2")}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-200">{t("about.heroDesc3")}</p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 sm:p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-slate-800/85 hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-brand-teal/10 flex items-center justify-center mb-6">
              <IconCompass className="w-7 h-7 text-brand-teal" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("about.missionTitle")}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{t("about.missionDesc")}</p>
          </Card>
          <Card className="p-8 sm:p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-slate-200/80 dark:border-slate-800/85 hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-electric-500/10 flex items-center justify-center mb-6">
              <IconTrend className="w-7 h-7 text-electric-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t("about.visionTitle")}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{t("about.visionDesc")}</p>
          </Card>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            title={t("about.problemTitle")}
            subtitle={t("about.problemSubtitle")}
            center
          />
          
          <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-rose-200/50 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                {t("about.problemClientTitle")}
              </h3>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                {[t("about.problemClient1"), t("about.problemClient2"), t("about.problemClient3"), t("about.problemClient4")].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 text-rose-500 shrink-0">×</span> {item}
                  </li>
                ))}
              </ul>
            </Card>
            
            <Card className="p-8 border-amber-200/50 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                {t("about.problemEngTitle")}
              </h3>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400">
                {[t("about.problemEng1"), t("about.problemEng2"), t("about.problemEng3"), t("about.problemEng4")].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 text-amber-500 shrink-0">×</span> {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <div className="inline-block p-4 sm:px-8 sm:py-6 rounded-2xl bg-brand-teal/5 border border-brand-teal/20 text-brand-teal dark:text-electric-300 font-semibold text-lg sm:text-xl">
              {t("about.problemConclusion")}
            </div>
          </div>
        </div>
      </section>

      {/* What Makes CLINKA Different */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <SectionHeader title={t("about.diffTitle")} center />
        <div className="mt-16 flex flex-wrap justify-center gap-6">
          {diffItems.map((item, i) => {
            const IconComp = item.Icon;
            return (
              <Card key={i} className="p-6 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] hover:shadow-lg hover:-translate-y-1 transition-all bg-white/60 dark:bg-slate-900/60 backdrop-blur">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 mb-5", item.color)}>
                  <IconComp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How CLINKA Works */}
      <section className="py-16 sm:py-24 bg-brand-ice dark:bg-navy-950/50 border-y border-slate-200 dark:border-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title={t("about.howTitle")} center />
          
          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            <div className="hidden lg:block absolute top-12 start-12 end-12 h-0.5 bg-slate-300 dark:bg-slate-700" />
            {howSteps.map((step, i) => {
              // Strip the number "1. " from the title
              const titleRaw = step.title.replace(/^\d+\.\s*/, '');
              return (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center text-3xl font-extrabold text-brand-teal dark:text-electric-400 mb-6">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{titleRaw}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who Is CLINKA For & Values */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-8">{t("about.whoTitle")}</h2>
          <div className="flex flex-wrap gap-3">
            {whoItems.map((item, i) => (
              <span key={i} className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-brand-teal dark:hover:border-electric-500 transition-colors cursor-default">
                {item}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-8">{t("about.valuesTitle")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {valueItems.map((val, i) => (
              <Card key={i} className="p-4 flex items-center justify-center sm:justify-start gap-3 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <IconCheck className="w-5 h-5 text-electric-500 shrink-0" />
                <span className="font-semibold text-sm text-center sm:text-start">{val}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Future */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950 p-8 sm:p-12 lg:p-16 text-white border-none shadow-2xl shadow-brand-teal/20 text-center">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="absolute -bottom-20 -end-20 h-80 w-80 bg-electric-500/30 blur-[100px] rounded-full" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-6">
              {t("about.futureTitle")}
            </h2>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed mb-10">
              {t("about.futureDesc")}
            </p>
            
            <Link href="/projects?create=1">
              <Button size="lg" className="!bg-white !text-brand-teal hover:!bg-brand-ice hover:scale-105 transition-transform font-bold px-8 shadow-xl">
                {t("about.ctaBtn")}
              </Button>
            </Link>
          </div>
        </Card>
      </section>
      
    </div>
  );
}
