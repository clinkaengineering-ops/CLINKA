export type LandingFeature = {
  id: string;
  titleKey: string;
  descriptionKey: string;
};

export type LandingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
};

export type LandingStat = {
  id: string;
  labelKey: string;
  value: string;
};

export const marketingFeatures: LandingFeature[] = [
  {
    id: "verified-credentials",
    titleKey: "feat.1.t",
    descriptionKey: "feat.1.d",
  },
  {
    id: "milestone-escrow",
    titleKey: "feat.2.t",
    descriptionKey: "feat.2.d",
  },
  {
    id: "bim-native-workflows",
    titleKey: "feat.3.t",
    descriptionKey: "feat.3.d",
  },
  {
    id: "discipline-bidding",
    titleKey: "feat.4.t",
    descriptionKey: "feat.4.d",
  },
  {
    id: "operations-analytics",
    titleKey: "feat.5.t",
    descriptionKey: "feat.5.d",
  },
  {
    id: "global-compliance",
    titleKey: "feat.6.t",
    descriptionKey: "feat.6.d",
  },
];

export const howItWorksSteps: LandingStep[] = [
  {
    id: "post-project",
    titleKey: "how.1.t",
    descriptionKey: "how.1.d",
  },
  {
    id: "receive-bids",
    titleKey: "how.2.t",
    descriptionKey: "how.2.d",
  },
  {
    id: "hire-escrow",
    titleKey: "how.3.t",
    descriptionKey: "how.3.d",
  },
  {
    id: "collaborate-ship",
    titleKey: "how.4.t",
    descriptionKey: "how.4.d",
  },
];

export const landingStats: LandingStat[] = [
  { id: "budget", labelKey: "stat.budget", value: "$3.4M" },
  { id: "timeline", labelKey: "stat.timeline", value: "12 weeks" },
  { id: "bids", labelKey: "stat.bids", value: "124+ bids" },
];
