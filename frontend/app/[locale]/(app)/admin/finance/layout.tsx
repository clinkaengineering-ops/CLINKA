"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { IconChart, IconWallet, IconBriefcase, IconSettings, IconShield } from "@/components/Icons";

const financeTabs = [
  { href: "/admin/finance", label: "Overview", icon: IconChart, exact: true },
  { href: "/admin/finance/payments", label: "Manual Payments", icon: IconWallet },
  { href: "/admin/finance/payouts", label: "Payouts", icon: IconBriefcase },
  { href: "/admin/finance/transactions", label: "Transactions Ledger", icon: IconShield },
  { href: "/admin/finance/settings", label: "Settings", icon: IconSettings },
];

export default function FinanceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Control Center</h1>
        <p className="text-slate-500 mt-1">Manage manual payments, withdrawals, and platform transactions.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {financeTabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg transition whitespace-nowrap",
                isActive
                  ? "text-electric-600 dark:text-electric-400 border-b-2 border-electric-500 -mb-px bg-electric-50 dark:bg-electric-900/10"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              <Icon width={16} height={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
