import { ReactNode } from "react";
import { Badge as UIBadge } from "@/components/UI";
import { cn } from "@/utils/cn";

export interface BadgeProps {
  className?: string;
  children: ReactNode;
  variant?: "default" | "destructive" | "secondary" | "outline";
  color?: "slate" | "blue" | "green" | "amber" | "rose" | "violet" | "electric";
}

export function Badge({ className, variant = "default", color, children, ...props }: BadgeProps) {
  const variantClass = variant === "destructive" ? "destructive bg-rose-500 text-white" : "";
  return (
    <UIBadge
      className={cn(variantClass, className)}
      color={variant === "destructive" ? "rose" : color}
      {...props}
    >
      {children}
    </UIBadge>
  );
}
