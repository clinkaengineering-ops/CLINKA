"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { authApi } from "../api/auth.api";

type ApiErrorResponse = {
  message?: string;
};

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(email: string, password: string) {
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login({ email, password });
      const userId = res.data.data.userId;
      sessionStorage.setItem("pendingUserId", String(userId));
      router.push("/verify-otp");
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}