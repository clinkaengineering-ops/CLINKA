export interface LandingPlatformStats {
  totalProjects: number;
  openProjects: number;
  completedProjects: number;
  totalBids: number;
  verifiedEngineers: number;
  escrowReleasedTotal: number;
  escrowReleasedLabel: string;
  avgBidsPerOpenProject: number;
}

export interface LandingFeaturedEngineer {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  projectCount: number;
  skills: string[];
}

export interface LandingTestimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

export interface LandingSnapshot {
  stats: LandingPlatformStats;
  featuredEngineers: LandingFeaturedEngineer[];
  testimonials: LandingTestimonial[];
}
