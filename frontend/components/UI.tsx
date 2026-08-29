import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { cn } from "@/utils/cn";
import { IconCheck } from "./Icons";
import { BrandLink } from "./BrandLogo";
import { AuthShellAside } from "./AuthShellAside";
import { ThemeToggle } from "./theme";
import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/mediaUrl";
/* ---------- Button ---------- */
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: ReactNode;
  }
>(
  (
    { className, variant = "primary", size = "md", icon, children, ...props },
    ref,
  ) => {
    const variants = {
      primary:
        "bg-brand-teal hover:bg-electric-400 text-white shadow-md shadow-brand-teal/25 border border-brand-teal/50 dark:bg-electric-400 dark:hover:bg-electric-300 dark:text-slate-950 dark:border-electric-300/40 dark:shadow-brand-teal/20 disabled:bg-brand-teal/50 dark:disabled:bg-electric-400/40",
      secondary:
        "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50",
      ghost:
        "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50",
      outline:
        "border-2 border-brand-teal/50 text-brand-teal dark:text-electric-300 bg-transparent hover:bg-brand-teal/10 dark:hover:bg-electric-500/15 disabled:opacity-50",
      danger:
        "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/30 disabled:bg-rose-600/50",
    };
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
          "motion-safe:active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/50",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

/* ---------- Card ---------- */
export const Card = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 backdrop-blur shadow-sm dark:shadow-none transition-smooth hover-lift",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

/* ---------- Badge ---------- */
export const Badge = ({
  className,
  children,
  color = "slate",
}: {
  className?: string;
  children: ReactNode;
  color?: "slate" | "blue" | "green" | "amber" | "rose" | "violet" | "electric";
}) => {
  const colors: Record<string, string> = {
    slate:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    green:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900",
    electric:
      "bg-electric-50 dark:bg-electric-950/40 text-electric-700 dark:text-electric-300 border-electric-200 dark:border-electric-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
};

/* ---------- Input ---------- */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; error?: boolean }
>(({ className, icon, error, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
    )}
    <input
      ref={ref}
      aria-invalid={error ? true : undefined}
      className={cn(
        "w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition",
        error
          ? "border-rose-500 focus:ring-rose-500/30 dark:border-rose-500"
          : "border-slate-200 dark:border-slate-800 focus:ring-electric-500/30",
        icon && "ps-10",
        className,
      )}
      {...props}
    />
  </div>
));
Input.displayName = "Input";

/* ---------- Textarea ---------- */
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={error ? true : undefined}
    className={cn(
      "w-full rounded-lg border bg-white dark:bg-slate-900 p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition",
      error
        ? "border-rose-500 focus:ring-rose-500/30 dark:border-rose-500"
        : "border-slate-200 dark:border-slate-800 focus:ring-electric-500/30",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ---------- Avatar ---------- */
export const Avatar = ({
  name,
  src,
  size = 40,
  ring = false,
}: {
  name: string;
  src?: string;
  size?: number;
  ring?: boolean;
}) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const colors = [
    "from-sky-500 to-blue-600",
    "from-violet-500 to-fuchsia-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-purple-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const resolvedSrc = resolveMediaUrl(src);
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full text-white font-semibold bg-gradient-to-br shrink-0",
        colors[idx],
        ring && "ring-2 ring-white dark:ring-slate-900",
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {resolvedSrc ? (
        <Image
          src={resolvedSrc}
          className="rounded-full object-cover"
          alt={name}
          width={size}
          height={size}
        />
      ) : (
        initials.toUpperCase()
      )}
    </div>
  );
};

/* ---------- VerifiedBadge ---------- */
export const VerifiedBadge = ({ size = 16 }: { size?: number }) => (
  <span
    className="inline-flex items-center justify-center bg-electric-500 rounded-full text-white"
    style={{ width: size, height: size }}
  >
    <IconCheck width={size * 0.6} height={size * 0.6} strokeWidth={3} />
  </span>
);

/* ---------- Progress ---------- */
export const Progress = ({
  value,
  color = "electric",
}: {
  value: number;
  color?: "electric" | "emerald" | "amber";
}) => {
  const colors = {
    electric: "bg-electric-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          colors[color],
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};

/* ---------- StatCard ---------- */
export const StatCard = ({
  label,
  value,
  change,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change?: string;
  icon: ReactNode;
  accent?: "up" | "down" | "none";
}) => {
  const isValueZero = /^(USD|\$|€|£)?\s*0(\.0+)?$/i.test(value.trim());
  const isChangeZero = change === "—" || (change && /^(\+|-)?\s*(USD|\$|€|£)?\s*0(\.0+)?(\s+|$|%)/i.test(change.trim()));
  const isChangeTextOnly = change && !/^(\+|-)?\s*(USD|\$|€|£)?\s*\d/i.test(change.trim());
  
  const isNeutral = isValueZero || isChangeZero || isChangeTextOnly;
  const finalAccent = accent === "down" ? "down" : accent === "none" ? "none" : (isNeutral ? "none" : "up");

  return (
    <Card className="p-5 hover:border-electric-500/40 transition group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                finalAccent === "down"
                  ? "text-rose-500"
                  : finalAccent === "none"
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-emerald-500",
              )}
            >
              {finalAccent === "down" ? "↓ " : finalAccent === "none" ? "" : "↑ "}
              {change.replace(/^[+-]\s*/, "")}
            </p>
          )}
        </div>
        <div className="h-10 w-10 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 flex items-center justify-center group-hover:scale-110 transition">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export const Field = ({
  label,
  right,
  error,
  children,
}: {
  label: string;
  right?: ReactNode;
  error?: string;
  children: ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {right}
    </div>
    {children}
    {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
  </div>
);

export const Divider = ({ label = "or" }: { label?: string }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden grid lg:grid-cols-2 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex items-center justify-center px-4 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <div className="absolute end-4 top-4 sm:end-6 sm:top-6 lg:end-8 lg:top-8">
          <ThemeToggle compact />
        </div>
        <div className="w-full max-w-md min-w-0">
          <BrandLink logoClassName="h-11 w-auto max-w-[220px] sm:h-12 sm:max-w-[260px]" priority />
          {children}
        </div>
      </div>

      <AuthShellAside />
    </div>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-4 w-4 border",
    md: "h-8 w-8 border-2",
    lg: "h-10 w-10 border-2",
  };
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "rounded-full border-brand-teal/30 border-t-brand-teal dark:border-electric-400/30 dark:border-t-electric-400 motion-safe:animate-spin",
        sizes[size],
        className,
      )}
    />
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-slate-200/80 dark:bg-slate-800/80 motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-copper-strong dark:text-brand-copper">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={cn("text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white", eyebrow ? "mt-4" : "")}>
        {title}
      </h2>
      {subtitle ? <p className="mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed sm:leading-8 text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
    </div>
  );
}

