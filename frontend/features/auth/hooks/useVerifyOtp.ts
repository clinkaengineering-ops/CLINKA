"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { authApi } from "../api/auth.api";
import useAuthStore from "@/store/authStore";

type ApiErrorResponse = {
  message?: string;
};

export function useVerifyOtp() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const loggedInUser = res.data.data;
      setUser(loggedInUser);
      sessionStorage.removeItem("pendingUserId");
      const nextParam = searchParams.get("next");
      const defaultHome =
        loggedInUser.role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(nextParam || defaultHome);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  return { verifyOtp, loading, error };
}