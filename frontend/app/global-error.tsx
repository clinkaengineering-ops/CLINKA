"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center gap-4 bg-brand-ice p-6 text-slate-900">
        <img
          src="/brand/logo/SVG/logo-09.svg"
          alt="CLINKA"
          className="h-10 w-auto"
        />
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-slate-600">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-[#1f7a99]"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
