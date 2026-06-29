import api from "@/lib/axios";
import type { Me, User } from "@/types";

export type RegistrationStatus =
  | { status: "available" }
  | { status: "exists"; role?: string }
  | { status: "resume_engineer"; portfolioCount: number };

export const authApi = {
  checkRegistrationEmail: (email: string) =>
    api
      .get<{ data: RegistrationStatus }>("/auth/register/status", {
        params: { email },
      })
      .then((r) => r.data.data),

  registerClient: (data: FormData | object) =>
    api.post<{ data: User }>("/auth/register/client", data),

  registerEngineer: (data: FormData) =>
    api.post<{ data: User }>("/auth/register/engineer", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  resumeEngineerRegistration: (data: FormData) =>
    api.post<{ data: User }>("/auth/register/engineer/resume", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  verifyOtp: (data: { userId: number; otp: string }) =>
    api.post("/auth/verify-otp", data),

  completeOAuthSession: (session: string) =>
    api.post<{ data: Me }>("/auth/oauth-session", { session }),

  verifyEmail: (token: string) =>
    api.get<{ data: Me }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  logout: () => api.post("/auth/logout"),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
};
