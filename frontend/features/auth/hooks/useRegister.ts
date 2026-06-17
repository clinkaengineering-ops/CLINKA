"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { parseApiValidation } from "@/lib/validation";

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function registerClient(data: {
    name: string;
    email: string;
    password: string;
  }) {
    setLoading(true);
    setError("");
    try {
      await authApi.registerClient(data);
      router.push("/login?registered=true");
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function registerEngineer(data: {
    name: string;
    email: string;
    password: string;
    specialty: "CIVIL" | "ARCHITECTURAL";
    bio?: string;
    nationality?: string;
    documentType: "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl";
    file: File;
  }) {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("specialty", data.specialty);
      formData.append("documentType", data.documentType);
      if (data.bio) formData.append("bio", data.bio);
      if (data.nationality) formData.append("nationality", data.nationality); 
      formData.append("document", data.file);
      await authApi.registerEngineer(formData);
      router.push("/login?registered=true");
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  return { registerClient, registerEngineer, loading, error };
}
