import { MyProjectsPage } from "@/features/projects/Pages/MyProjectsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Projects | CLINKA",
  description:
    "View and manage all your engineering projects, bids, and contracts in one place.",
};

export default function Page() {
  return <MyProjectsPage />;
}
