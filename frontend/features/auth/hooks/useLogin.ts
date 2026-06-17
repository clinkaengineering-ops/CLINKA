"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../api/auth.api";
import { parseApiValidation } from "@/lib/validation";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(email: string, password: string) {
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login({ email, password });
      const userId = res.data.data.userId;
      sessionStorage.setItem("pendingUserId", String(userId));
      const next = searchParams.get("next");
      router.push(next ? `/verify-otp?next=${encodeURIComponent(next)}` : "/verify-otp");
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}