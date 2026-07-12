import ProjectsPage from "../../../features/projects/Pages/ProjectPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engineering Projects",
  description: "Find engineering freelance jobs and architectural projects. Bid on active projects and collaborate with global clients on CLINKA.",
};

export default function Page() {
  return <ProjectsPage />;
}