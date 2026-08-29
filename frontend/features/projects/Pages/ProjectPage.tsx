"use client";

import { Suspense } from "react";
import ProjectMarketplace from "../components/ProjectMarketplace";

export default function ProjectsPage() {
  return (
    <main className="px-4 py-8 lg:px-8">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading projects…</p>}>
        <ProjectMarketplace />
      </Suspense>
    </main>
  );
}