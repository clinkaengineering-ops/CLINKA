import { EngineersPage } from "@/features/engineers/Pages/EngineersPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire Top Engineers",
  description: "Browse and hire top-rated civil, mechanical, electrical, and architectural engineers. Find the perfect freelance engineering talent for your next project.",
};

export default function Page() {
  return <EngineersPage />;
}
