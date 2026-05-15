import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SVGProps, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { ThemeToggle } from "@/components/theme";

export function AuthShell({ children }: { children: ReactNode }) {
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
              Design, supervision, and review services - fast, safe, and verified.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Verified engineers only",
              "Secure escrow payments",
              "Real-time project tracking",
              "Design, supervision & review",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
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
                <div key={initials} className="h-7 w-7 rounded-full bg-linear-to-br from-electric-400 to-navy-600 border-2 border-navy-950 text-[10px] flex items-center justify-center font-bold">
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

export const AuthCard = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("animate-fade-up", className)}>{children}</div>
);

export const AuthField = ({ label, right, children }: { label: string; right?: ReactNode; children: ReactNode }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {right}
    </div>
    {children}
  </div>
);

export const AuthInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }>(
  ({ className, icon, ...props }, ref) => (
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500/30 focus:border-electric-500/60 transition",
          icon && "pl-10",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
AuthInput.displayName = "AuthInput";

export const AuthTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-electric-500/30 transition", className)}
      {...props}
    />
  ),
);
AuthTextArea.displayName = "AuthTextArea";

export const AuthButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md"; icon?: ReactNode }>(
  ({ className, variant = "primary", size = "md", icon, children, ...props }, ref) => {
    const variants = {
      primary: "bg-electric-600 text-white hover:bg-electric-700",
      secondary: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800",
      ghost: "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
    };

    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-electric-500/40 disabled:opacity-50", variants[variant], sizes[size], className)}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);
AuthButton.displayName = "AuthButton";

export const AuthDivider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">or</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);

const svgProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconMail = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

export const IconLock = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconUser = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const IconArrow = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

export const IconCheck = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <path d="m5 12 4 4 10-10" />
  </svg>
);

export const IconBriefcase = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

export const IconLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <path d="M5 19V5l7 4 7-4v14l-7-4-7 4Z" />
  </svg>
);

export const IconEye = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...svgProps} {...props}>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);