"use client";

import { BrandLink } from "@/components/BrandLogo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6">
      <BrandLink logoClassName="h-10 w-auto" />
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Something went wrong
      </h2>
      <p className="max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-electric-400 dark:bg-electric-400 dark:text-slate-950"
      >
        Try again
      </button>
    </div>
  );
}
