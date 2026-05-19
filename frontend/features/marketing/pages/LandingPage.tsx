"use client";

import Link from "next/link";
import { Avatar, Badge, Button, Card, SectionHeader, VerifiedBadge } from "@/components/UI";
import {
  IconArrow,
  IconBolt,
  IconBriefcase,
  IconCheck,
  IconCompass,
  IconCube,
  IconLayers,
  IconShield,
  IconStar,
  IconTrend,
  IconWallet,
  IconLogo,
  IconGlobe,
} from "@/components/Icons";
import { useLandingContent } from "../hooks/useLandingContent";

export function LandingPage() {
  const { hero, features, steps, stats, cta, trustedBy, talent, testimonials } = useLandingContent();

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-x-0 -top-40 h-[600px] bg-gradient-to-b from-electric-500/15 via-electric-500/5 to-transparent blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <Badge color="electric">
                <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" /> {hero.badge}
              </Badge>
              <h1 className="mt-6 text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
                {hero.title1}
                <span className="block bg-gradient-to-r from-electric-400 via-electric-500 to-navy-600 bg-clip-text text-transparent">{hero.title2}</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-xl">{hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={hero.primaryHref} className="inline-block">
                  <Button size="lg" icon={<IconBriefcase width={18} height={18} />}>{hero.primaryLabel}</Button>
                </Link>
                <Link href={hero.secondaryHref} className="inline-block">
                  <Button size="lg" variant="secondary" icon={<IconBolt width={18} height={18} />}>{hero.secondaryLabel}</Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                {hero.points.map((p, i) => (
                  <div key={i} className="flex items-center gap-2"><IconCheck width={16} height={16} className="text-electric-500" /> {p}</div>
                ))}
              </div>
            </div>

            {/* Hero card mock */}
            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-electric-400/30 to-navy-600/30 blur-3xl rounded-[2rem]" />
                <Card className="relative shadow-2xl shadow-navy-900/10 dark:shadow-electric-500/10 overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{hero.live}</p>
                    </div>
                    <Badge color="electric">{"Featured"}</Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold">Project Listing</h3>
                    <p className="text-xs text-slate-500 mt-0.5">12-Story Mixed-Use Tower</p>
                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <Stat label={"Budget"} value={"$25K"} />
                      <Stat label={"Timeline"} value={"10w"} />
                      <Stat label={"Bids"} value={"14"} />
                    </div>
                    <div className="mt-5 space-y-3">
                      {talent.slice(0, 3).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-electric-500/50 transition">
                          <Avatar name={e.name} size={36} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold truncate">{e.name}</p>
                              <VerifiedBadge size={14} />
                            </div>
                            <p className="text-xs text-slate-500 truncate">{e.role}</p>
                          </div>
                          <div className="text-end">
                            <p className="text-sm font-bold text-electric-600 dark:text-electric-400">{"$22,400"}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 justify-end"><IconStar width={10} height={10} className="text-amber-500" />{e.rating}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <div className="absolute -end-4 -bottom-4 hidden md:flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl animate-float">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><IconWallet width={18} height={18} /></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{hero.escrowReleased}</p>
                    <p className="text-sm font-bold">$12,500.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo bar */}
          <div className="mt-20">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">{hero.trustedBy}</p>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 opacity-70 dark:opacity-60">
              {trustedBy.map((l) => (
                <div key={l} className="text-center text-lg font-bold tracking-wider text-slate-500 dark:text-slate-400">{l}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-24 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow={"Features"} title={"Platform features"} subtitle={"Everything you need to hire and manage engineers."} center />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const IconComp = f.icon;
              return (
                <Card key={i} className="p-6 hover:border-electric-500/40 hover:shadow-xl hover:shadow-electric-500/5 transition group">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-electric-500/15 to-navy-700/15 text-electric-600 dark:text-electric-400 flex items-center justify-center group-hover:scale-110 transition">
                    {IconComp ? <IconComp width={22} height={22} /> : null}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUSTED ENGINEERS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeader eyebrow={"Talent"} title={"Trusted engineers"} subtitle={"Browse verified engineering professionals."} />
            <Link href="/engineers"><Button variant="outline" icon={<IconArrow width={16} height={16} />}>Browse</Button></Link>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {talent.map((e) => (
              <Card key={e.name} className="p-5 hover:-translate-y-1 hover:border-electric-500/40 hover:shadow-xl transition">
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} size={48} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold truncate">{e.name}</p>
                      <VerifiedBadge size={14} />
                    </div>
                    <p className="text-xs text-slate-500 truncate">{e.role}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 font-semibold"><IconStar width={14} height={14} className="text-amber-500" />{e.rating}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">{e.projects} projects</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {e.skills.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative py-24 bg-navy-950 text-white overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[800px] bg-electric-500/20 blur-[120px] rounded-full" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-electric-500/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-electric-300">How it works</span>
            <h2 className="mt-4 text-4xl font-bold">{"How it works"}</h2>
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

      {/* TESTIMONIALS */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow={"Testimonials"} title={"What clients say"} center />
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {testimonials.map((tt, i) => (
              <Card key={i} className="p-6 hover:border-electric-500/40 transition">
                <div className="flex items-center gap-1 text-amber-500">{[...Array(5)].map((_, k) => <IconStar key={k} width={14} height={14} />)}</div>
                <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">"{tt.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar name={tt.name} size={40} />
                  <div>
                    <p className="text-sm font-bold">{tt.name}</p>
                    <p className="text-xs text-slate-500">{tt.role}</p>
                  </div>
                </div>
              </Card>
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
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight">{cta.title}</h2>
                <p className="mt-4 text-white/70 text-lg">{cta.subtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row md:justify-end gap-3">
                <Link href={"/auth/register"}><Button size="lg">{cta.primaryLabel}</Button></Link>
                <Link href={"/engineers"}><Button size="lg" variant="secondary" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">{cta.secondaryLabel}</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5">
    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
    <p className="mt-0.5 font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);
