// features/users/components/EngineerCardSkeleton.tsx
import { Card } from "@/components/UI";

export function EngineerCardSkeleton() {
  return (
    <Card className="p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      </div>
      <div className="mt-5 flex justify-between">
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </Card>
  );
}
