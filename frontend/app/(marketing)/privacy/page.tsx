import type { Metadata } from "next";
import { PrivacyPage } from "@/features/marketing/pages/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — CLINKA",
  description: "How CLINKA collects, uses, and protects your personal information.",
};

export default function Page() {
  return <PrivacyPage />;
}
