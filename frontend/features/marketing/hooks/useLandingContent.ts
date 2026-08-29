"use client";

import { useI18n } from "@/i18n";
import type { ComponentType } from "react";
import {
  IconShield,
  IconWallet,
  IconCube,
  IconLayers,
  IconTrend,
  IconCompass,
} from "@/components/Icons";
import type { LandingFeature, LandingStep, LandingStat } from "../api/landing.api";
import { landingStats, marketingFeatures, howItWorksSteps } from "../api/landing.api";
import { useLandingData } from "./useLandingData";

export type LandingHeroContent = {
  badge: string;
  title1: string;
  title2: string;
  subtitle: string;
  live: string;
  escrowReleased: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  points: string[];
  trustedBy: string;
};

export type LandingCtaContent = {
  title: string;
  subtitle: string;
  primaryLabel: string;
  secondaryLabel: string;
  primaryHref: string;
  secondaryHref: string;
};

export type LandingTalent = {
  name: string;
  role: string;
  rating: number;
  projects: number;
  skills: string[];
};

export type LandingTestimonial = {
  quote: string;
  name: string;
  role: string;
};

export type LandingContent = {
  hero: LandingHeroContent;
  features: Array<
    LandingFeature & { title: string; description: string; icon?: ComponentType<{ width?: number; height?: number }> }
  >;
  steps: Array<LandingStep & { title: string; description: string }>;
  stats: Array<LandingStat & { label: string }>;
  cta: LandingCtaContent;
  trustedBy: string[];
  talent: LandingTalent[];
  testimonials: LandingTestimonial[];
  platformLive: boolean;
};

function specialtyLabel(specialty: string, t: (k: string) => string): string {
  if (specialty === "ARCHITECTURAL") return t("disc.architecture");
  if (specialty === "CIVIL") return t("disc.structural");
  return specialty;
}

export function useLandingContent(): LandingContent {
  const { t } = useI18n();
  const { data: live } = useLandingData();

  const hero: LandingHeroContent = {
    badge: t("hero.badge"),
    title1: t("hero.title1"),
    title2: t("hero.title2"),
    subtitle: t("hero.subtitle"),
    live: live
      ? `${live.stats.openProjects} open projects`
      : t("hero.live"),
    escrowReleased: live
      ? `${live.stats.escrowReleasedLabel} released via escrow`
      : t("hero.escrowReleased"),
    primaryLabel: t("hero.hire"),
    primaryHref: "/register",
    secondaryLabel: t("hero.findWork"),
    secondaryHref: "/login",
    points: [t("hero.f1"), t("hero.f2"), t("hero.f3")],
    trustedBy: t("hero.trustedBy"),
  };

  const features = marketingFeatures.map((feature) => ({
    ...feature,
    title: t(feature.titleKey),
    description: t(feature.descriptionKey),
    icon:
      feature.id === "verified-credentials"
        ? IconShield
        : feature.id === "milestone-escrow"
          ? IconWallet
          : feature.id === "bim-native-workflows"
            ? IconCube
            : feature.id === "discipline-bidding"
              ? IconLayers
              : feature.id === "operations-analytics"
                ? IconTrend
                : IconCompass,
  }));

  const steps = howItWorksSteps.map((step) => ({
    ...step,
    title: t(step.titleKey),
    description: t(step.descriptionKey),
  }));

  const stats = live
    ? [
        {
          id: "open-projects",
          labelKey: "stat.budget",
          value: String(live.stats.openProjects),
          label: "Open projects",
        },
        {
          id: "engineers",
          labelKey: "stat.timeline",
          value: String(live.stats.verifiedEngineers),
          label: "Verified engineers",
        },
        {
          id: "bids",
          labelKey: "stat.bids",
          value: `${live.stats.totalBids}+`,
          label: "Bids placed",
        },
      ]
    : landingStats.map((stat) => ({
        ...stat,
        label: t(stat.labelKey),
      }));

  const talent: LandingTalent[] = live?.featuredEngineers.length
    ? live.featuredEngineers.map((e) => ({
        name: e.name,
        role: specialtyLabel(e.specialty, t),
        rating: e.rating || 4.5,
        projects: e.projectCount,
        skills: e.skills.length ? e.skills : [specialtyLabel(e.specialty, t)],
      }))
    : [];

  const testimonials: LandingTestimonial[] = live?.testimonials.length
    ? live.testimonials.map((item) => ({
        quote: item.quote,
        name: item.name,
        role: item.role,
      }))
    : [
        { quote: t("test.1"), name: "Hana Park", role: "Director, Meridian Developments" },
        { quote: t("test.2"), name: "Marcus Chen", role: "BIM Coordinator" },
        { quote: t("test.3"), name: "Sofia Rinaldi", role: "Principal Architect, Studio R" },
      ];

  const cta: LandingCtaContent = {
    title: t("cta.title"),
    subtitle: t("cta.subtitle"),
    primaryLabel: t("cta.create"),
    secondaryLabel: t("cta.explore"),
    primaryHref: "/register",
    secondaryHref: "/projects",
  };

  return {
    hero,
    features,
    steps,
    stats,
    cta,
    trustedBy: ["AECOM", "Foster+", "ARCADIS", "WSP", "JACOBS", "BURO·H"],
    talent,
    testimonials,
    platformLive: Boolean(live),
  };
}
