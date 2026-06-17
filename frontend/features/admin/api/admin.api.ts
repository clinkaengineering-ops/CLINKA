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
  openDisputes: number;
}

export interface PendingVerification {
  profileId: number;
  userId: number;
  name: string;
  email: string;
  specialty: string;
  documentType: string;
  collegeIdUrl: string | null;
  certificateUrl: string | null;
  syndicateCardUrl: string | null;
  submittedAt: string;
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
}

export const fetchAdminAnalytics = () =>
  unwrap(api.get<ApiResponse<AnalyticsData>>("/admin/analytics"));

export interface SystemLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
}

export const fetchSystemLogs = () =>
  unwrap(api.get<ApiResponse<SystemLog[]>>("/admin/logs"));

