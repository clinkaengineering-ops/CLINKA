import api from "@/lib/axios";
import type { User } from "@/types";

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

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post("/auth/reset-password", data),

  logout: () => api.post("/auth/logout"),

  applyAsEngineer: (data: FormData) =>
    api.post<{ data: User }>("/auth/apply-engineer", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  completeGoogleEngineer: (data: FormData) =>
    api.post<{ data: User }>("/auth/register/engineer/google-complete", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),

  googleCompleteRegistration: (data: { token: string; role: string; specialty?: string; bio?: string; nationality?: string }) =>
    api.post<{ data: User }>("/auth/google/complete-registration", data),
};
