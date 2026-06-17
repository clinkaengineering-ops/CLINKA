"use client";

import Link from "next/link";
import { Badge, Button, Card, SectionHeader } from "@/components/UI";
import {
  IconArrow,
  IconBolt,
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
  const { t } = useI18n();

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
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-electric-500/15 via-electric-500/5 to-transparent blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-up">
            <Badge color="electric">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
              {t("hero.badge2") || "The marketplace for the built environment"}
            </Badge>
            <h1 className="mt-6 text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              {t("hero.title1")}
              <span className="block bg-gradient-to-r from-electric-400 via-electric-500 to-navy-600 bg-clip-text text-transparent">
                {t("hero.title2")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="inline-block">
                <Button size="lg" icon={<IconBriefcase width={18} height={18} />}>
                  {t("hero.hire")}
                </Button>
              </Link>
              <Link href="/login" className="inline-block">
                <Button size="lg" variant="secondary" icon={<IconBolt width={18} height={18} />}>
                  {t("hero.findWork")}
                </Button>
              </Link>
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
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            <Card className="lg:col-span-8 p-7 md:p-9 overflow-hidden relative">
              <div className="absolute -top-24 -end-24 h-64 w-64 rounded-full bg-electric-500/10 blur-3xl" />
              <div className="relative">
                <Badge color="electric">New</Badge>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                  Post your drawings — we'll do the work for you.
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl">
                  Upload plans, get matched to verified engineers, and pay securely through milestone escrow.
                  When you confirm delivery, funds are sent to the engineer.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={
                      "/projects?create=1&service=REVIEW" +
                      "&title=" +
                      encodeURIComponent("Drawing review & corrections") +
                      "&description=" +
                      encodeURIComponent(
                        "I want an engineer to review my drawings, mark corrections, and deliver an updated PDF set. Attach files in chat after accepting a bid.",
                      ) +
                      "&budget=" +
                      encodeURIComponent("2500")
                    }
                    className="inline-block"
                  >
                    <Button size="lg" icon={<IconArrow width={18} height={18} />}>
                      Get started
                    </Button>
                  </Link>
                  <Link href="/projects" className="inline-block">
                    <Button size="lg" variant="secondary">
                      Browse projects
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 1</p>
                    <p className="mt-1 font-semibold">Post drawings</p>
                  </Card>
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 2</p>
                    <p className="mt-1 font-semibold">Pay to start</p>
                  </Card>
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 3</p>
                    <p className="mt-1 font-semibold">Confirm delivery</p>
                  </Card>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-4 p-7 md:p-9 bg-gradient-to-br from-navy-950 to-slate-950 text-white border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                <IconShield width={16} height={16} className="text-electric-300" />
                Escrow protection
              </div>
              <p className="mt-3 text-2xl font-bold">Pay only when the work is delivered.</p>
              <p className="mt-3 text-sm text-white/70">
                Funds are secured once you pay. Engineers start immediately, and you release payment after reviewing the deliverables.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-300" />
                10% platform fee, transparent
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-300" />
                Chat + file sharing included
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <IconCheck width={16} height={16} className="text-emerald-300" />
                Arabic + English support
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
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
      <section className="relative py-24 bg-navy-950 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[800px] bg-electric-500/20 blur-[120px] rounded-full" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-electric-500/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-electric-300">
              {t("how.eyebrow")}
            </span>
            <h2 className="mt-4 text-4xl font-bold">{t("how.title")}</h2>
            <p className="mt-4 text-slate-400">{t("how.subtitle")}</p>
          </div>
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition">
                <div className="text-electric-400 text-4xl font-bold tracking-tighter">0{i + 1}</div>
                <h3 className="mt-3 font-bold text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-electric-700 p-10 lg:p-16 text-white">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="absolute -end-20 -top-20 h-80 w-80 bg-electric-400/40 blur-[100px] rounded-full" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">{t("cta.title")}</h2>
                <p className="mt-4 text-white/70 text-lg">{t("cta.subtitle")}</p>
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
