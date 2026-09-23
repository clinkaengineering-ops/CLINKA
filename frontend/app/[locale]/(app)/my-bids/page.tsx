"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyBidsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/my-projects");
  }, [router]);

  return (
    <p className="text-sm text-slate-500 p-8">Redirecting…</p>
  );
}
