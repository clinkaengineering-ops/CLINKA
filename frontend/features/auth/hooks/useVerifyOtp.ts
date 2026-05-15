"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { authApi } from "../api/auth.api";
import useAuthStore from "@/store/authStore";

type ApiErrorResponse = {
  message?: string;
};

export function useVerifyOtp() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verifyOtp(otp: string) {
    setLoading(true);
    setError("");
    const userId = sessionStorage.getItem("pendingUserId");
    if (!userId) { router.push("/login"); return; }
    try {
      const res = await authApi.verifyOtp({ userId: Number(userId), otp });
      setUser(res.data.data);
      sessionStorage.removeItem("pendingUserId");
      router.push("/dashboard");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return { verifyOtp, loading, error };
}