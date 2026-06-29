"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { parseApiValidation } from "@/lib/validation";

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function goToCheckEmail(email: string) {
    router.push(`/register/check-email?email=${encodeURIComponent(email)}`);
  }

  async function registerClient(data: {
    name: string;
    email: string;
    password: string;
  }) {
    setLoading(true);
    setError("");
    try {
      await authApi.registerClient(data);
      goToCheckEmail(data.email);
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
      goToCheckEmail(data.email);
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
      goToCheckEmail(data.email);
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  }

  async function checkEmail(email: string) {
    return authApi.checkRegistrationEmail(email);
  }

  return { registerClient, registerEngineer, resumeEngineer, checkEmail, loading, error };
}
