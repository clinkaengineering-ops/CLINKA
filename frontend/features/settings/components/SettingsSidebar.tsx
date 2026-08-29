"use client";

import { Card } from "@/components/UI";
import { cn } from "@/utils/cn";
import type { ComponentType } from "react";

export type SettingsTabId =
  | "account"
  | "notif"
  | "security"
  | "billing"
  | "professional";

export type SettingsTab = {
  id: SettingsTabId;
  label: string;
  icon: ComponentType<{ width?: number; height?: number }>;
};

interface Props {
  tabs: SettingsTab[];
  active: SettingsTabId;
  onChange: (id: SettingsTabId) => void;
}

export function SettingsSidebar({ tabs, active, onChange }: Props) {
  return (
    <Card className="p-2 h-fit">
      {tabs.map((tt) => {
        const Icon = tt.icon;
        return (
          <button
            key={tt.id}
            type="button"
            onClick={() => onChange(tt.id)}
            className={cn(
              "w-full px-3 h-10 rounded-lg flex items-center gap-3 text-sm transition",
              active === tt.id
                ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            )}
          >
            <Icon width={16} height={16} />
            {tt.label}
          </button>
        );
      })}
    </Card>
  );
}
