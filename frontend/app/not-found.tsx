import Link from "next/link";
import { IconSearch } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
        <IconSearch className="h-10 w-10 text-slate-400" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">Page Not Found</h1>
      <p className="mt-3 max-w-md text-slate-500 dark:text-slate-400">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-lg bg-electric-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-electric-700"
        >
          Go to Homepage
        </Link>
        <Link
          href="/engineers"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Browse Engineers
        </Link>
        <Link
          href="/projects"
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Browse Projects
        </Link>
      </div>
    </div>
  );
}
