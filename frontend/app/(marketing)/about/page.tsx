import type { Metadata } from "next";
import { AboutPage } from "@/features/marketing/pages/AboutPage";

export const metadata: Metadata = {
  title: "About — CLINKA",
  description:
    "CLINKA is a pioneering digital ecosystem bridging architectural thought and civil execution.",
};

export default function Page() {
  return <AboutPage />;
}
