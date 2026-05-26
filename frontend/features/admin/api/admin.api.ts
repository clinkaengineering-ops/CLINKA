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
