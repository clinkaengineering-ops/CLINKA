"use client";
import { Suspense } from "react";
import { EngineersList } from "../components/EngineersList";
import { EngineerCardSkeleton } from "../components/EngineerCardSkeleton";

function EngineersFallback() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="h-10 w-64 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <EngineerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function EngineersPage() {
  return (
    <Suspense fallback={<EngineersFallback />}>
      <EngineersList />
    </Suspense>
  );
}
