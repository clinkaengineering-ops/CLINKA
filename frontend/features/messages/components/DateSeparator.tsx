export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
