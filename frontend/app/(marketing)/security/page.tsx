import type { Metadata } from "next";
import { SecurityPage } from "@/features/marketing/pages/SecurityPage";

export const metadata: Metadata = {
  title: "Security — CLINKA",
  description: "How CLINKA protects accounts, payments, messaging, and professional verification.",
};

export default function Page() {
  return <SecurityPage />;
}
