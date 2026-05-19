// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts
// Single source of truth for every shared type in the application.
// Nothing outside this file should re-declare these shapes.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "CLIENT" | "ENGINEER" | "ADMIN";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

// ── Auth store user (lightweight — no profile) ───────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
}

// ── Portfolio & reviews ───────────────────────────────────────────────────────
export interface PortfolioItem {
  id: number;
  imageUrl: string;
  description: string;
  engineerId: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string; // was missing — used in EngineerProfilePage
}

// ── Engineer profile (full shape returned by GET /users/engineers/:id) ────────
export interface EngineerProfile {
  id: number;
  userId: number;
  bio: string | null;
  specialty: string | null;
  averageRating: number | null;
  totalReviews: number;
  verificationStatus: VerificationStatus;
  // verification document URLs (used for verification badges on profile page)
  collegeIdUrl: string | null;
  certificateUrl: string | null;
  syndicateCardUrl: string | null;
  portfolio: PortfolioItem[];
  reviews: Review[];
}

// ── Full "me" shape returned by GET /users/me ─────────────────────────────────
// Extends User with the nested profile and timestamps.
export interface Me extends User {
  profile: EngineerProfile | null;
  updatedAt: string;
}

// ── Engineer list item (GET /users/engineers) ─────────────────────────────────
export interface Engineer {
  id: number;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
  profile: EngineerProfile | null;
}

// ── Messaging ─────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  name: string;
  preview: string;
  time: string;
  online: boolean;
  unread: number;
}

export interface Notification {
  id: string;
  title: string;
  time: string;
  read: boolean;
}

// ── Client dashboard shapes ───────────────────────────────────────────────────
export interface DashboardStats {
  activeProjects: number;
  activeProjectsChange: string;
  inEscrow: string;
  inEscrowChange: string;
  engineersHired: number;
  engineersHiredChange: string;
  avgDeliveryDays: number;
  avgDeliveryChange: string;
}

export interface SpendOverview {
  total: string;
  changePercent: number;
  series: number[];
}

export interface ClientProject {
  id: string;
  title: string;
  discipline: string;
  engineerName: string;
  engineerAvatar?: string;
  progressPercent: number;
  dueDate: string;
  escrowAmount: string;
}

export interface EscrowItem {
  id: string;
  milestoneId: string;
  label: string;
  project: string;
  status: "In escrow" | "Released" | "Pending";
  amount: string;
  dueIn: string;
}

export interface EscrowOverview {
  total: string;
  changePercent: number;
  series: number[];
}

// ── Project marketplace ───────────────────────────────────────────────────────
export type ServiceType = "DESIGN" | "SUPERVISION" | "REVIEW";

export interface Project {
  id: number;
  title: string;
  description: string;
  discipline: string;
  budgetMin: number;
  budgetMax: number;
  timelineWeeks: number;
  clientName: string;
  postedAt: string;
  bidsCount: number;
  isFeatured: boolean;
}

export interface Bid {
  id: number;
  projectId: number;
  engineerName: string;
  amount: number;
  message: string | null;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  serviceType: ServiceType;
  bids: Bid[];
}
