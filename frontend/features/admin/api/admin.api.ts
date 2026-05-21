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
