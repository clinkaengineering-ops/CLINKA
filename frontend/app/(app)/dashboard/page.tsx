"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { ClientDashboardPage } from "@/features/dashboard/Client/Pages/ClientDashboardPage";
import { EngineerDashboardPage } from "@/features/dashboard/Engineer/components/EngineerDashboardPage";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [user, router]);

  if (!user || user.role === "ADMIN") {
    return null;
  }

  if (user.role === "ENGINEER") {
    return <EngineerDashboardPage />;
  }

  return <ClientDashboardPage />;
}
