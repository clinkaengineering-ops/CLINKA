"use client";

import { Card } from "../../../components/UI";
import type { Project } from "../api/project.api";
import { ProjectCard } from "./ProjectCard";

interface ProjectListPanelProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ProjectListPanel({
  projects,
  loading,
  error,
  selectedId,
  onSelect,
}: ProjectListPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
            <div className="mt-2 h-4 w-4/5 rounded bg-slate-100 dark:bg-slate-800/60" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-rose-500 font-medium">Failed to load projects</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  if (!projects.length) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">No projects match your filters.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          selected={selectedId === p.id}
          onClick={() => onSelect(p.id)}
        />
      ))}
    </div>
  );
}
