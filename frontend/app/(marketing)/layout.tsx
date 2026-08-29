import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-brand-ice text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 min-w-0 w-full">{children}</main>
      <Footer />
    </div>
  );
}
