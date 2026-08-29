import type { Metadata } from "next";
import { TermsPage } from "@/features/marketing/pages/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service — CLINKA",
  description: "Terms and conditions for using the CLINKA engineering marketplace.",
};

export default function Page() {
  return <TermsPage />;
}
