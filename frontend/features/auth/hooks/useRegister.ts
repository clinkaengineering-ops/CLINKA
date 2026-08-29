"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { getMe } from "@/features/engineers/api/engineer.api";
import { parseApiValidation } from "@/lib/validation";
import useAuthStore from "@/store/authStore";

function redirectToCheckEmail(
  router: ReturnType<typeof useRouter>,
  email: string,
) {
  router.push(`/register/check-email?email=${encodeURIComponent(email)}`);
}

async function finishGoogleRegistration(
  router: ReturnType<typeof useRouter>,
  setUser: ReturnType<typeof useAuthStore.getState>["setUser"],
) {
  const me = await getMe();
  setUser(me);
  router.push(me.role === "ADMIN" ? "/admin" : "/dashboard");
}

export function useRegister() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
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
      redirectToCheckEmail(router, data.email);
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
    portfolioFiles: File[];
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
      for (const file of data.portfolioFiles) {
        formData.append("portfolio", file);
      }
      await authApi.registerEngineer(formData);
      redirectToCheckEmail(router, data.email);
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function resumeEngineer(data: {
    email: string;
    password: string;
    portfolioFiles: File[];
  }) {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      for (const file of data.portfolioFiles) {
        formData.append("portfolio", file);
      }
      await authApi.resumeEngineerRegistration(formData);
      redirectToCheckEmail(router, data.email);
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function completeGoogleEngineer(data: {
    specialty: "CIVIL" | "ARCHITECTURAL";
    bio?: string;
    nationality: string;
    documentType: "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl";
    file: File;
    portfolioFiles: File[];
  }) {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("specialty", data.specialty);
      formData.append("nationality", data.nationality);
      formData.append("documentType", data.documentType);
      if (data.bio) formData.append("bio", data.bio);
      formData.append("document", data.file);
      for (const file of data.portfolioFiles) {
        formData.append("portfolio", file);
      }
      await authApi.completeGoogleEngineer(formData);
      await finishGoogleRegistration(router, setUser);
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function checkEmail(email: string) {
    return authApi.checkRegistrationEmail(email);
  }

  return { registerClient, registerEngineer, resumeEngineer, completeGoogleEngineer, checkEmail, loading, error };
}
