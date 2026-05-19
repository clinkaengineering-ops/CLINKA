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
import { ThemeToggle } from "./theme";
import Link from "next/link";
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
        "bg-electric-500 hover:bg-electric-400 text-white shadow-lg shadow-electric-500/20 border border-electric-400/30",
      secondary:
        "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800",
      ghost:
        "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
      outline:
        "border border-electric-500/40 text-electric-600 dark:text-electric-400 hover:bg-electric-500/10",
      danger:
        "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20",
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
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-electric-500/40",
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
      "rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur",
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
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }
>(({ className, icon, ...props }, ref) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
    )}
    <input
      ref={ref}
      className={cn(
        "w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition",
        icon && "pl-10",
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
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition",
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
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-full text-white font-semibold bg-gradient-to-br shrink-0",
        colors[idx],
        ring && "ring-2 ring-white dark:ring-slate-900",
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img
          src={src}
          className="w-full h-full rounded-full object-cover"
          alt={name}
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
  accent?: "up" | "down";
}) => (
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
              accent === "down" ? "text-rose-500" : "text-emerald-500",
            )}
          >
            {accent === "down" ? "↓" : "↑"} {change}
          </p>
        )}
      </div>
      <div className="h-10 w-10 rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-400 flex items-center justify-center group-hover:scale-110 transition">
        {icon}
      </div>
    </div>
  </Card>
);

export const Field = ({
  label,
  right,
  children,
}: {
  label: string;
  right?: ReactNode;
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
  </div>
);

export const Divider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
      or
    </span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <div className="absolute right-6 top-6 lg:right-8 lg:top-8">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-electric-400 to-navy-700 flex items-center justify-center text-white shadow-lg shadow-electric-500/20">
              <span className="font-bold text-sm">C</span>
            </div>
            <span className="font-bold tracking-wide">CLINKA</span>
          </Link>
          {children}
        </div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -bottom-40 -inset-e-40 h-150 w-150 bg-electric-500/30 blur-[120px] rounded-full" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-electric-500/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-electric-300">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-400 animate-pulse" />
              Live Platform
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight">
              Connect with top engineering talent
            </h2>
            <p className="mt-4 text-white/70">
              Design, supervision, and review services - fast, safe, and
              verified.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Verified engineers only",
              "Secure escrow payments",
              "Real-time project tracking",
              "Design, supervision & review",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur"
              >
                <span className="h-7 w-7 rounded-lg bg-electric-500/30 text-electric-300 flex items-center justify-center">
                  ✓
                </span>
                <p className="text-sm">{feature}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/60">
            <div className="flex -space-x-2">
              {["MH", "AK", "SR", "FE"].map((initials) => (
                <div
                  key={initials}
                  className="h-7 w-7 rounded-full bg-linear-to-br from-electric-400 to-navy-600 border-2 border-navy-950 text-[10px] flex items-center justify-center font-bold"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span>Join 500+ engineers and clients</span>
          </div>
        </div>
      </div>
    </div>
  );
}

