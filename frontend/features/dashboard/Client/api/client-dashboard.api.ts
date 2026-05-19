// features/client/api/client-dashboard.api.ts
// Dashboard-specific API calls (stats, spend, projects, escrow, notifications).
// User identity (Me) comes from lib/api/user.api — NOT re-declared here.
import api from "@/lib/axios";
import type {
  DashboardStats,
  SpendOverview,
  ClientProject,
  Notification,
  Message,
  EscrowItem,
} from "@/types";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";


const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

// ── Stats ─────────────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/dashboard/stats */
export const fetchDashboardStats = (): Promise<DashboardStats> =>
  unwrap(api.get<ApiResponse<DashboardStats>>("/client/dashboard/stats"));

// ── Spend ─────────────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/dashboard/spend?period= */
export const fetchSpendOverview = (
  period: "1M" | "6M" | "12M" | "all" = "12M"
): Promise<SpendOverview> =>
  unwrap(
    api.get<ApiResponse<SpendOverview>>("/client/dashboard/spend", {
      params: { period },
    })
  );

// ── Projects ──────────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/projects?status=active */
export const fetchActiveProjects = (): Promise<ClientProject[]> =>
  unwrap(
    api.get<ApiResponse<ClientProject[]>>("/client/projects", {
      params: { status: "active" },
    })
  );

// ── Notifications ─────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/notifications */
export const fetchNotifications = (): Promise<Notification[]> =>
  unwrap(api.get<ApiResponse<Notification[]>>("/client/notifications"));

/** 🔌 Wire when route exists: PATCH /client/notifications/:id/read */
export const markNotificationRead = (id: string): Promise<void> =>
  api.patch(`/client/notifications/${id}/read`).then(() => undefined);

// ── Messages ──────────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/messages?limit= */
export const fetchMessages = (limit = 4): Promise<Message[]> =>
  unwrap(
    api.get<ApiResponse<Message[]>>("/client/messages", { params: { limit } })
  );

// ── Escrow ────────────────────────────────────────────────────────────────────
/** 🔌 Wire when route exists: GET /client/escrow */
export const fetchEscrowItems = (): Promise<EscrowItem[]> =>
  unwrap(api.get<ApiResponse<EscrowItem[]>>("/client/escrow"));

/** 🔌 Wire when route exists: POST /client/escrow/:milestoneId/release */
export const releaseMilestone = (milestoneId: string): Promise<void> =>
  unwrap(
    api.post<ApiResponse<void>>(`/client/escrow/${milestoneId}/release`)
  );
