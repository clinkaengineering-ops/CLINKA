import type { Metadata } from "next";
import { AboutPage } from "@/features/marketing/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about CLINKA's mission to connect the world's best engineering talent with clients needing top-tier architectural and civil engineering services.",
};

export default function Page() {
  return <AboutPage />;
}
