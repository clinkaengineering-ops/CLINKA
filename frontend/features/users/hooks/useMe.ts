"use client";
import { useState, useEffect } from "react";
import { userApi } from "../api/user.api";
import type { User } from "@/types";

export function useMe() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const res = await userApi.getMe();
        setUser(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  async function updateMe(data: { name?: string; bio?: string }) {
    try {
      const res = await userApi.updateMe(data);
      setUser(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  }

  return { user, loading, error, updateMe };
}
