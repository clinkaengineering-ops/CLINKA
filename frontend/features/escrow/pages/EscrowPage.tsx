"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/UI";
import useAuthStore from "@/store/authStore";

export function EscrowPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.role === "ENGINEER") {
      router.replace("/balance");
      return;
    }
    router.replace("/projects");
  }, [router, user?.role]);

  return (
    <Card className="mx-auto max-w-4xl p-8 text-center text-slate-500">
      Redirecting to your project payment flow...
    </Card>
  );
}