"use client";

import Link from "next/link";
import { Badge, Button, Card, SectionHeader } from "@/components/UI";
import { BrandLogo } from "@/components/BrandLogo";
import { LiveBackground } from "@/components/LiveBackground";
import {
  IconArrow,
  IconBriefcase,
  IconCheck,
  IconShield,
  IconWallet,
  IconCube,
  IconLayers,
  IconTrend,
  IconCompass,
} from "@/components/Icons";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import { JoinAsEngineerButton } from "../components/JoinAsEngineerButton";
import { marketingFeatures, howItWorksSteps } from "../api/landing.api";

const iconMap: Record<string, React.ComponentType<{ width?: number; height?: number; className?: string }>> = {
  "verified-credentials": IconShield,
  "milestone-escrow": IconWallet,
  "bim-native-workflows": IconCube,
  "discipline-bidding": IconLayers,
  "operations-analytics": IconTrend,
  "global-compliance": IconCompass,
};

export function LandingPage() {
  const { t, dir } = useI18n();
  const isRtl = dir === "rtl";

  const features = marketingFeatures.map((f) => ({
    ...f,
    title: t(f.titleKey),
    description: t(f.descriptionKey),
    Icon: iconMap[f.id] ?? IconCompass,
  }));

  const steps = howItWorksSteps.map((s) => ({
    ...s,
    title: t(s.titleKey),
    description: t(s.descriptionKey),
  }));

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative overflow-x-hidden min-h-[90vh]">
        <LiveBackground className="z-0" />
        <div className="absolute inset-0 z-0 grid-bg opacity-60 dark:opacity-20" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-brand-teal/15 via-brand-copper/5 to-transparent blur-3xl pointer-events-none" />
        <div
          className={cn(
            "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 lg:pb-32",
            isRtl ? "pt-12 sm:pt-16 lg:pt-24" : "pt-16 sm:pt-20 lg:pt-28",
          )}
        >
          <div className="max-w-3xl mx-auto text-center animate-fade-up relative">
            <div className="absolute start-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none select-none">
              <BrandLogo
                variant="mark"
                className="w-[280px] sm:w-[420px] lg:w-[560px] h-auto opacity-[0.2] dark:opacity-[0.25]"
              />
            </div>
            <BrandLogo
              variant="horizontal"
              className="mx-auto h-16 sm:h-20 md:h-24 w-auto max-w-[min(100%,480px)] mb-6"
              priority
            />
            <Badge color="electric">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
              {t("hero.badge2")}
            </Badge>
            <h1
              className={cn(
                "font-bold tracking-tight text-slate-900 dark:text-white overflow-visible relative",
                isRtl
                  ? "mt-4 text-3xl sm:text-4xl lg:text-6xl leading-[1.35]"
                  : "mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-[1.1] sm:leading-[1.05]",
              )}
            >
              {t("hero.title1")}
              {t("hero.title2") ? (
                <span
                  className={cn(
                    "block bg-gradient-to-r from-brand-teal via-brand-teal to-brand-copper bg-clip-text text-transparent",
                    isRtl && "pb-1 leading-[1.4]",
                  )}
                >
                  {t("hero.title2")}
                </span>
              ) : null}
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/projects?create=1" className="inline-block">
                <Button size="lg" icon={<IconBriefcase width={18} height={18} />}>
                  {t("hero.hire")}
                </Button>
              </Link>
              <JoinAsEngineerButton />
            </div>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
              {[t("hero.f1"), t("hero.f2"), t("hero.f3")].map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <IconCheck width={16} height={16} className="text-electric-500" /> {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POST YOUR DRAWINGS (CONCIERGE) */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <Card className="lg:col-span-8 p-7 md:p-9 overflow-hidden relative">
              <div className="absolute -top-24 -end-24 h-64 w-64 rounded-full bg-electric-500/10 blur-3xl" />
              <div className="relative">
                <Badge color="electric">{t("landing.concierge.badge")}</Badge>
                <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                  {t("landing.concierge.title")}
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">
                  {t("landing.concierge.body")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={
                      "/projects?create=1&service=REVIEW" +
                      "&title=" +
                      encodeURIComponent(t("landing.concierge.projectTitle")) +
                      "&description=" +
                      encodeURIComponent(t("landing.concierge.projectDesc")) +
                      "&budget=" +
                      encodeURIComponent("2500")
                    }
                    className="inline-block"
                  >
                    <Button size="lg" icon={<IconArrow width={18} height={18} />}>
                      {t("landing.concierge.cta")}
                    </Button>
                  </Link>
                  <Link href="/projects" className="inline-block">
                    <Button size="lg" variant="secondary">
                      {t("landing.concierge.browse")}
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("landing.concierge.stepLabel")} 1
                    </p>
                    <p className="mt-1 font-semibold">{t("landing.concierge.step1")}</p>
                  </Card>
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("landing.concierge.stepLabel")} 2
                    </p>
                    <p className="mt-1 font-semibold">{t("landing.concierge.step2")}</p>
                  </Card>
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {t("landing.concierge.stepLabel")} 3
                    </p>
                    <p className="mt-1 font-semibold">{t("landing.concierge.step3")}</p>
                  </Card>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-4 p-7 md:p-9 border-slate-200 bg-gradient-to-br from-white via-brand-ice to-brand-teal/10 text-slate-900 shadow-md dark:border-slate-800 dark:from-navy-950 dark:via-navy-950 dark:to-slate-950 dark:text-white dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-teal/80 dark:text-white/70">
                <IconShield width={16} height={16} className="text-brand-teal dark:text-electric-300" />
                {t("landing.escrow.badge")}
              </div>
              <p className="mt-3 text-2xl font-bold">{t("landing.escrow.title")}</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-white/70">
                {t("landing.escrow.body")}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-600 dark:text-emerald-300" />
                {t("landing.escrow.f1")}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-600 dark:text-emerald-300" />
                {t("landing.escrow.f2")}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-600 dark:text-emerald-300" />
                {t("landing.escrow.f3")}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader
            eyebrow={t("feat.eyebrow")}
            title={t("feat.title")}
            subtitle={t("feat.subtitle")}
            center
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const IconComp = f.Icon;
              return (
                <Card key={i} className="p-6 hover:border-electric-500/40 hover:shadow-xl hover:shadow-electric-500/5 transition group">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-electric-500/15 to-navy-700/15 text-electric-600 dark:text-electric-400 flex items-center justify-center group-hover:scale-110 transition">
                    <IconComp width={22} height={22} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-16 sm:py-24 overflow-hidden bg-brand-ice text-slate-900 dark:bg-navy-950 dark:text-white">
        <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-50" />
        <div className="absolute -top-40 start-1/2 -translate-x-1/2 h-96 w-full max-w-[800px] bg-brand-teal/10 dark:bg-electric-500/20 blur-[120px] rounded-full" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-teal dark:border-electric-500/30 dark:bg-electric-500/10 dark:text-electric-300">
              {t("how.eyebrow")}
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold">{t("how.title")}</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">{t("how.subtitle")}</p>
          </div>
          <div className="mt-10 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm backdrop-blur transition hover:border-brand-teal/30 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:bg-white/10"
              >
                <div className="text-brand-teal dark:text-electric-400 text-4xl font-bold tracking-tighter">
                  0{i + 1}
                </div>
                <h3 className="mt-3 font-bold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-electric-700 p-6 sm:p-10 lg:p-16 text-white">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute -end-20 -top-20 h-80 w-80 bg-electric-400/40 blur-[100px] rounded-full" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">{t("cta.title")}</h2>
                <p className="mt-4 text-white/70 text-base sm:text-lg">{t("cta.subtitle")}</p>
              </div>
              <div className="flex flex-col sm:flex-row md:justify-end gap-3">
                <Link href="/register">
                  <Button size="lg">{t("cta.create")}</Button>
                </Link>
                <Link href="/projects">
                  <Button size="lg" variant="secondary" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                    {t("cta.explore")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
