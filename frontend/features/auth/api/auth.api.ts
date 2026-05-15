import api from "@/lib/axios";

export const authApi = {
  registerClient: (data: FormData | object) =>
    api.post("/auth/register/client", data),

  registerEngineer: (data: FormData) =>
    api.post("/auth/register/engineer", data, {
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

  getMe: () => api.get("/auth/me"),
};