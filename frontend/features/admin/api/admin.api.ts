import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export interface AdminStats {
  totalUsers: number;
  totalEngineers: number;
  totalClients: number;
  totalProjects: number;
  pendingVerifications: number;
  gmv: number;
  inEscrow: number;
  openSupportTickets: number;
  newUsersLast30: number;
  newUsersPrev30: number;
  activeBans: number;
  totalCommission: number;
}

export interface PendingVerification {
  profileId: number;
  userId: number;
  name: string;
  email: string;
  specialty: string;

  portfolios: string[];
  submittedAt: string;
}

export function isReviewableVerification(v: PendingVerification): boolean {
  return (v.portfolios?.filter(Boolean).length ?? 0) >= 3;
}

export const fetchAdminStats = (): Promise<AdminStats> =>
  unwrap(api.get<ApiResponse<AdminStats>>("/admin/stats")).then((d) => {
    if (!d) throw new Error("Failed to load stats");
    return d;
  });

export const fetchPendingVerifications = (): Promise<PendingVerification[]> =>
  unwrap(
    api.get<ApiResponse<PendingVerification[]>>("/admin/verifications/pending"),
  ).then((d) => d ?? []);

export const updateVerification = (
  profileId: number,
  status: "APPROVED" | "REJECTED",
) =>
  unwrap(
    api.patch<ApiResponse<unknown>>(`/admin/verifications/${profileId}`, {
      status,
    }),
  );

export interface AdminBan {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  reason: "CONTACT_INFO_SHARING" | "MANUAL_BAN";
  bannedAt: string;
  expiresAt: string;
  active: boolean;
  note: string | null;
  triggerMessage: string | null;
  bannedById: number | null;
  bannedByName: string | null;
}

export const fetchAllBans = (): Promise<AdminBan[]> =>
  unwrap(api.get<ApiResponse<AdminBan[]>>("/admin/bans")).then((d) => d ?? []);

export const lookupAdminUser = (
  identifier: string,
): Promise<{ id: number; name: string; email: string; role: string }> =>
  unwrap(
    api.get<ApiResponse<{ id: number; name: string; email: string; role: string }>>(
      "/admin/users/lookup",
      { params: { identifier } },
    ),
  ).then((d) => {
    if (!d) throw new Error("User not found");
    return d;
  });

export const banUserAdmin = (userId: number, note?: string) =>
  unwrap(
    api.post<ApiResponse<unknown>>(`/admin/bans/${userId}`, { note }),
  );

export const unbanUserAdmin = (userId: number) =>
  unwrap(api.delete<ApiResponse<unknown>>(`/admin/bans/${userId}`));

export const manualFreeze = (engineerId: number, amount: number, reason: string) =>
  unwrap(api.post<ApiResponse<any>>("/disputes/manual-freeze", { engineerId, amount, reason }));

export const resolveDisputeAdmin = (projectId: number, resolution: "ENGINEER" | "CLIENT", reason: string) =>
  unwrap(api.post<ApiResponse<any>>("/disputes/resolve", { projectId, resolution, reason }));

export const escalateDisputeAdmin = (projectId: number) =>
  unwrap(api.post<ApiResponse<any>>("/disputes/escalate", { projectId }));

export interface AdminConversationItem {
  id: number;
  projectId: number;
  projectTitle: string;
  clientId: number;
  clientName: string;
  engineerId: number;
  engineerName: string;
  lastMessage: string | null;
  lastMessageAt: string;
  messageCount: number;
}

export interface AdminConversationsPage {
  conversations: AdminConversationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchAdminConversations = (
  page = 1,
  limit = 20,
): Promise<AdminConversationsPage> =>
  unwrap(
    api.get<ApiResponse<AdminConversationsPage>>("/admin/conversations", {
      params: { page, limit },
    }),
  ).then((d) => {
    if (!d) throw new Error("Failed to load conversations");
    return d;
  });

export interface AdminMessageSender {
  id: number;
  name: string;
  role: string;
}

export interface AdminChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  createdAt: string;
  sender: AdminMessageSender;
}

export interface AdminMessagesPage {
  messages: AdminChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  conversation: {
    id: number;
    projectId: number;
    clientId: number;
    engineerId: number;
  };
}

export const fetchAdminConversationMessages = (
  conversationId: number,
  page = 1,
  limit = 50,
): Promise<AdminMessagesPage> =>
  unwrap(
    api.get<ApiResponse<AdminMessagesPage>>(
      `/admin/conversations/${conversationId}/messages`,
      { params: { page, limit } },
    ),
  ).then((d) => {
    if (!d) throw new Error("Failed to load messages");
    return d;
  });

export const impersonateUserAdmin = (userId: number): Promise<any> =>
  unwrap(api.post<ApiResponse<any>>(`/admin/impersonate/${userId}`));

export const updateProfileAdmin = (
  userId: number,
  data: { specialty?: "CIVIL" | "ARCHITECTURAL"; bio?: string },
): Promise<any> =>
  unwrap(api.patch<ApiResponse<any>>(`/admin/profiles/${userId}`, data));

export interface AdminProject {
  id: number;
  title: string;
  description: string;
  budget: number;
  serviceType: string;
  status: string;
  isFlagged: boolean;
  createdAt: string;
  client: { name: string; email: string };
}

export const fetchAdminProjects = (page = 1, limit = 20) =>
  unwrap(api.get<ApiResponse<{ projects: AdminProject[]; totalPages: number }>>("/admin/projects", { params: { page, limit } }));

export const updateAdminProject = (projectId: number, data: { status?: string; isFlagged?: boolean }) =>
  unwrap(api.patch<ApiResponse<any>>(`/admin/projects/${projectId}/status`, data));

export interface AdminReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  client: { name: string };
  engineer: { user: { name: string } };
  project: { title: string };
}

export const fetchAdminReviews = (page = 1, limit = 20) =>
  unwrap(api.get<ApiResponse<{ reviews: AdminReview[]; totalPages: number }>>("/admin/reviews", { params: { page, limit } }));

export const deleteAdminReview = (reviewId: number) =>
  unwrap(api.delete<ApiResponse<any>>(`/admin/reviews/${reviewId}`));

export interface PlatformSettings {
  platformFeePercent: number;
}

export const fetchPlatformSettings = () =>
  unwrap(api.get<ApiResponse<PlatformSettings>>("/admin/settings"));

export const updatePlatformSettings = (data: { platformFeePercent: number }) =>
  unwrap(api.patch<ApiResponse<any>>("/admin/settings", data));

export interface AdminPayment {
  id: number;
  amount: number;
  commission: number;
  status: string;
  isAdminOverride: boolean;
  createdAt: string;
  client: { name: string; email: string };
  engineer: { user: { name: string; email: string } };
  project: { title: string };
}

export const fetchAdminPayments = (page = 1, limit = 20) =>
  unwrap(api.get<ApiResponse<{ payments: AdminPayment[]; totalPages: number }>>("/admin/payments", { params: { page, limit } }));

export const overrideAdminPayment = (paymentId: number, status: "RELEASED" | "REFUNDED") =>
  unwrap(api.patch<ApiResponse<any>>(`/admin/payments/${paymentId}/override`, { status }));

export interface AnalyticsData {
  dailySignups: Array<{ date: string; count: number }>;
  dailyGmv: Array<{ date: string; amount: number }>;
  dailyCommission: Array<{ date: string; amount: number }>;
  monthlySignups: Array<{ month: string; count: number }>;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  revenueYtd: number;
  yoyGrowth: number;
  netMargin: number;
  platformFeePercent: number;
  totalGmv: number;
  totalSignups: number;
}

export interface EscrowOverview {
  totalInEscrow: number;
  released30d: number;
  refunded30d: number;
  disputed: number;
  utilizationPercent: number;
  dailyEscrowHeld: Array<{ date: string; amount: number }>;
}

export interface ActiveDispute {
  id: number;
  projectId: number;
  caseId: string;
  parties: string;
  subject: string;
  amount: number | null;
  status: string;
  statusColor: "amber" | "blue" | "green" | "red";
  ageHours: number;
  createdAt: string;
}

export interface SystemHealth {
  services: Array<{ name: string; up: boolean; uptime: number }>;
  allOperational: boolean;
  apiLatencyMs: number;
  queueStatus: string;
}

export const fetchAdminAnalytics = (): Promise<AnalyticsData> =>
  unwrap(api.get<ApiResponse<AnalyticsData>>("/admin/analytics")).then((d) => {
    if (!d) throw new Error("Failed to load analytics");
    return d;
  });

export const fetchEscrowOverview = (): Promise<EscrowOverview> =>
  unwrap(api.get<ApiResponse<EscrowOverview>>("/admin/escrow-overview")).then((d) => {
    if (!d) throw new Error("Failed to load escrow overview");
    return d;
  });

export const fetchActiveDisputes = (limit = 20): Promise<ActiveDispute[]> =>
  unwrap(
    api.get<ApiResponse<ActiveDispute[]>>("/admin/disputes", { params: { limit } }),
  ).then((d) => d ?? []);

export const resolveDispute = (projectId: number, resolution: "ENGINEER" | "CLIENT", reason: string) =>
  unwrap(api.post<ApiResponse<any>>("/disputes/resolve", { projectId, resolution, reason }));

export const fetchSystemHealth = (): Promise<SystemHealth> =>
  unwrap(api.get<ApiResponse<SystemHealth>>("/admin/system-health")).then((d) => {
    if (!d) throw new Error("Failed to load system health");
    return d;
  });

export interface SystemLog {
  id?: string | number;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  action?: string;
  actorId?: number;
  actorRole?: string;
  targetId?: string;
}

export const fetchSystemLogs = (
  page = 1,
  limit = 50,
  filters?: {
    userId?: number;
    targetId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<SystemLog[]> =>
  unwrap(api.get<ApiResponse<SystemLog[]>>("/admin/logs", { params: { page, limit, ...filters } })).then((d) => d ?? []);

export interface AdminSupportTicket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "OPEN" | "SOLVED" | "UNRESOLVED";
  solution: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: number; name: string } | null;
}

export interface AdminSupportTicketsPage {
  tickets: AdminSupportTicket[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchSupportTickets = (page = 1, limit = 50): Promise<AdminSupportTicketsPage> =>
  unwrap(
    api.get<ApiResponse<AdminSupportTicketsPage>>("/admin/support-tickets", {
      params: { page, limit },
    }),
  ).then((d) => {
    if (!d) throw new Error("Failed to load support tickets");
    return d;
  });

export const updateSupportTicket = (
  ticketId: number,
  data: { status: "SOLVED" | "UNRESOLVED"; solution: string },
) =>
  unwrap(
    api.patch<ApiResponse<AdminSupportTicket>>(
      `/admin/support-tickets/${ticketId}`,
      data,
    ),
  );

export interface AdminWithdrawalRequest {
  id: number;
  userId: number;
  amount: number;
  method: string;
  accountNumber: string;
  status:
    | "PENDING"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "TRANSFER_INITIATED"
    | "SUBMITTED"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "REVERSED"
    | "REJECTED"
    | "FAILED_NEEDS_MANUAL_REVIEW";
  adminNotes: string | null;
  paymobTransactionId?: string | null;
  paymobDisbursementStatus?: string | null;
  paymobStatusDescription?: string | null;
  paymobClientReference?: string | null;
  failureReason?: string | null;
  processedAt: string | null;
  createdAt: string;
  user: { id: number; name: string; email: string };
}

export interface PayoutStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  manualReview: number;
  volume24h: number;
  volume30d: number;
  successRate: number;
}

export interface PayoutAuditEntry {
  id: number;
  withdrawalId: number;
  event: string;
  statusBefore: string | null;
  statusAfter: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminWithdrawalRequestsPage {
  items: AdminWithdrawalRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchAdminWithdrawalRequests = (
  page = 1,
  limit = 20,
  status?: AdminWithdrawalRequest["status"],
): Promise<AdminWithdrawalRequestsPage> =>
  unwrap(
    api.get<ApiResponse<AdminWithdrawalRequestsPage>>("/admin/withdrawals", {
      params: { page, limit, status },
    }),
  ).then((d) => {
    if (!d) throw new Error("Failed to load withdrawal requests");
    return d;
  });

export const fetchPayoutStats = (): Promise<PayoutStats> =>
  unwrap(api.get<ApiResponse<PayoutStats>>("/admin/withdrawals/stats")).then(
    (d) => {
      if (!d) throw new Error("Failed to load payout stats");
      return d;
    },
  );

export const fetchWithdrawalAuditTrail = (
  withdrawalId: number,
): Promise<PayoutAuditEntry[]> =>
  unwrap(
    api.get<ApiResponse<PayoutAuditEntry[]>>(
      `/admin/withdrawals/${withdrawalId}/audit`,
    ),
  ).then((d) => d ?? []);

export const triggerPayoutReconciliation = (): Promise<{
  checked: number;
  updated: number;
}> =>
  unwrap(
    api.post<ApiResponse<{ checked: number; updated: number }>>(
      "/admin/payouts/reconcile",
    ),
  ).then((d) => {
    if (!d) throw new Error("Reconciliation failed");
    return d;
  });

export const cancelAdminWithdrawal = (
  withdrawalId: number,
  reason?: string,
) =>
  unwrap(
    api.post<ApiResponse<AdminWithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/cancel`,
      { reason },
    ),
  );

export const resolveAdminWithdrawal = (
  withdrawalId: number,
  action: "release_funds" | "mark_completed" | "cancel",
  reason?: string,
) =>
  unwrap(
    api.post<ApiResponse<AdminWithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/resolve`,
      { action, reason },
    ),
  );

export const updateWithdrawalRequestStatus = (
  withdrawalId: number,
  data: {
    status: AdminWithdrawalRequest["status"];
    adminNotes?: string;
  },
) =>
  unwrap(
    api.patch<ApiResponse<AdminWithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}`,
      data,
    ),
  );

export const revealAdminWithdrawalBankDetails = (withdrawalId: number) =>
  unwrap(
    api.post<ApiResponse<any>>(
      `/admin/withdrawals/${withdrawalId}/reveal-bank-details`,
    ),
  );

export const rejectAdminWithdrawal = (withdrawalId: number, reason: string, notes?: string) =>
  unwrap(
    api.post<ApiResponse<AdminWithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/reject`,
      { reason, notes },
    ),
  );

export const recordAdminCompletion = (
  withdrawalId: number,
  transferReference: string,
  transferMethod?: string,
  notes?: string,
  proofFile?: File,
) => {
  const formData = new FormData();
  formData.append("transferReference", transferReference);
  if (transferMethod) formData.append("transferMethod", transferMethod);
  if (notes) formData.append("notes", notes);
  if (proofFile) formData.append("proof", proofFile);

  return unwrap(
    api.post<ApiResponse<AdminWithdrawalRequest>>(
      `/admin/withdrawals/${withdrawalId}/record-completion`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),
  );
};
