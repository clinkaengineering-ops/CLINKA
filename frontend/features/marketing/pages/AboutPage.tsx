"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useI18n } from "@/i18n";
import { Button, Card } from "@/components/UI";
import {
  IconShield,
  IconWallet,
  IconCube,
  IconLayers,
  IconBolt,
} from "@/components/Icons";

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-slate-600 dark:text-slate-400 text-base sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-copper" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AboutPage() {
  const { t } = useI18n();

  const differentiators = [
    { title: t("about.different.1.title"), desc: t("about.different.1.desc"), Icon: IconShield },
    { title: t("about.different.2.title"), desc: t("about.different.2.desc"), Icon: IconWallet },
    { title: t("about.different.3.title"), desc: t("about.different.3.desc"), Icon: IconBolt },
    { title: t("about.different.4.title"), desc: t("about.different.4.desc"), Icon: IconLayers },
    { title: t("about.different.5.title"), desc: t("about.different.5.desc"), Icon: IconCube },
  ];

  const audience = Array.from({ length: 9 }, (_, i) => t(`about.who.${i + 1}`));

  const steps = Array.from({ length: 4 }, (_, i) => ({
    title: t(`about.how.${i + 1}.title`),
    desc: t(`about.how.${i + 1}.desc`),
  }));

  const values = Array.from({ length: 6 }, (_, i) => t(`about.values.${i + 1}`));

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hero */}
      <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800/85">
        <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-40" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-brand-teal/10 via-brand-copper/5 to-transparent blur-3xl" />

        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            <BrandLogo variant="stacked" className="w-32 sm:w-40" priority />
          </div>

          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-brand-copper">
            {t("about.hero.eyebrow")}
          </p>

          <h1 className="mt-3 pb-3 sm:pb-4 text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-normal sm:leading-snug bg-gradient-to-r from-brand-teal via-brand-teal to-brand-copper bg-clip-text text-transparent">
            {t("about.hero.tagline")}
          </h1>

          <div className="mt-10 sm:mt-12 space-y-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed text-start sm:text-center">
            <p>{t("about.hero.p1")}</p>
            <p>{t("about.hero.p2")}</p>
            <p>{t("about.hero.p3")}</p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur border-slate-200/80 dark:border-slate-800/85">
            <h2 className="text-xl font-bold text-brand-teal">{t("about.mission.title")}</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("about.mission.text")}
            </p>
          </Card>
          <Card className="p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur border-slate-200/80 dark:border-slate-800/85">
            <h2 className="text-xl font-bold text-brand-teal">{t("about.vision.title")}</h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("about.vision.text")}
            </p>
          </Card>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/85">
        <SectionHeading title={t("about.problem.title")} subtitle={t("about.problem.intro")} />
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-8">
            <h3 className="font-bold text-lg">{t("about.problem.clientsTitle")}</h3>
            <div className="mt-5">
              <BulletList
                items={[
                  t("about.problem.client1"),
                  t("about.problem.client2"),
                  t("about.problem.client3"),
                  t("about.problem.client4"),
                ]}
              />
            </div>
          </Card>
          <Card className="p-8">
            <h3 className="font-bold text-lg">{t("about.problem.engineersTitle")}</h3>
            <div className="mt-5">
              <BulletList
                items={[
                  t("about.problem.engineer1"),
                  t("about.problem.engineer2"),
                  t("about.problem.engineer3"),
                  t("about.problem.engineer4"),
                ]}
              />
            </div>
          </Card>
        </div>
        <p className="mt-10 text-center text-lg font-semibold text-brand-teal">
          {t("about.problem.closing")}
        </p>
      </section>

      {/* Differentiators */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/85">
        <SectionHeading title={t("about.different.title")} />
        <div className="grid gap-6 sm:grid-cols-2">
          {differentiators.map(({ title, desc, Icon }) => (
            <Card
              key={title}
              className="p-7 bg-white/50 dark:bg-slate-900/50 hover:border-brand-teal/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/85">
        <SectionHeading title={t("about.who.title")} />
        <div className="flex flex-wrap justify-center gap-3">
          {audience.map((label) => (
            <span
              key={label}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/85">
        <SectionHeading title={t("about.how.title")} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.title} className="p-6 text-center">
              <div className="mx-auto h-10 w-10 rounded-full bg-brand-teal text-white flex items-center justify-center font-bold">
                {i + 1}
              </div>
              <h3 className="mt-4 font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/85">
        <SectionHeading title={t("about.values.title")} />
        <div className="flex flex-wrap justify-center gap-3">
          {values.map((value) => (
            <span
              key={value}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
            >
              {value}
            </span>
          ))}
        </div>
      </section>

      {/* Future */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center border-t border-slate-200/80 dark:border-slate-800/85">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t("about.future.title")}</h2>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400">{t("about.future.p1")}</p>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t("about.future.p2")}</p>
        <p className="mt-8 text-xl font-bold bg-gradient-to-r from-brand-teal to-brand-copper bg-clip-text text-transparent">
          {t("about.future.tagline")}
        </p>
      </section>

      {/* CTA */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950 p-8 sm:p-12 lg:p-16 text-white border-none shadow-xl shadow-brand-teal/10">
          <div className="absolute inset-0 grid-bg opacity-20" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center md:text-start">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight">
                {t("about.ctaTitle")}
              </h2>
              <p className="mt-4 text-white/80 text-base sm:text-lg">{t("about.ctaDesc")}</p>
            </div>
            <Link href="/projects" className="shrink-0">
              <Button
                size="lg"
                className="!bg-white !text-brand-teal hover:!bg-brand-ice transition-all duration-200 shadow-md font-semibold border-none"
              >
                {t("about.ctaBtn")}
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
