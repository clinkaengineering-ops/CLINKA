import type { Metadata } from "next";
import { HelpCenterPage } from "@/features/support/pages/HelpCenterPage";

export const metadata: Metadata = {
  title: "Help Center — CLINKA",
  description: "Get help with CLINKA — submit a support request or email our team directly.",
};

export default function Page() {
  return <HelpCenterPage />;
}
