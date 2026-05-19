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
  features: Array<LandingFeature & { title: string; description: string; icon?: ComponentType<any> }>;
  steps: Array<LandingStep & { title: string; description: string }>;
  stats: Array<LandingStat & { label: string }>;
  cta: LandingCtaContent;
  trustedBy: string[];
  talent: LandingTalent[];
  testimonials: LandingTestimonial[];
};

export function useLandingContent(): LandingContent {
  const { t } = useI18n();

  const hero: LandingHeroContent = {
    badge: t("hero.badge"),
    title1: t("hero.title1"),
    title2: t("hero.title2"),
    subtitle: t("hero.subtitle"),
    live: t("hero.live"),
    escrowReleased: t("hero.escrowReleased"),
    primaryLabel: t("hero.hire"),
    primaryHref: "/auth/register",
    secondaryLabel: t("hero.findWork"),
    secondaryHref: "/auth/login",
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

  const stats = landingStats.map((stat) => ({
    ...stat,
    label: t(stat.labelKey),
  }));

  const trustedBy = ["AECOM", "Foster+", "ARCADIS", "WSP", "JACOBS", "BURO·H"];

  const talent: LandingTalent[] = [
    {
      name: "Layla Hassan",
      role: `${t("disc.structural")} · Cairo`,
      rating: 4.9,
      projects: 64,
      skills: ["ETABS", "Concrete"],
    },
    {
      name: "Marcus Chen",
      role: `${t("disc.bim")} · Singapore`,
      rating: 4.8,
      projects: 41,
      skills: ["Revit", "ISO 19650"],
    },
    {
      name: "Sofia Rinaldi",
      role: `${t("disc.architecture")} · Milan`,
      rating: 5.0,
      projects: 32,
      skills: ["Rhino", "LEED"],
    },
    {
      name: "Ahmed Al-Farsi",
      role: `${t("disc.mep")} · Dubai`,
      rating: 4.7,
      projects: 78,
      skills: ["Revit MEP", "ASHRAE"],
    },
  ];

  const testimonials: LandingTestimonial[] = [
    { quote: t("test.1"), name: "Hana Park", role: "Director, Meridian Developments" },
    { quote: t("test.2"), name: "Marcus Chen", role: "BIM Coordinator" },
    { quote: t("test.3"), name: "Sofia Rinaldi", role: "Principal Architect, Studio R" },
  ];

  const cta: LandingCtaContent = {
    title: t("cta.title"),
    subtitle: t("cta.subtitle"),
    primaryLabel: t("cta.create"),
    secondaryLabel: t("cta.explore"),
    primaryHref: "/auth/register",
    secondaryHref: "/projects",
  };

  return { hero, features, steps, stats, cta, trustedBy, talent, testimonials };
}
