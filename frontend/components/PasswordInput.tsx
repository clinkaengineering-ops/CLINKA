"use client";

import { forwardRef, useState } from "react";
import { Input } from "./UI";
import { IconEye, IconEyeOff } from "./Icons";
import { type InputHTMLAttributes, type ReactNode } from "react";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; error?: boolean }
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        className={className}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <IconEyeOff width={18} height={18} /> : <IconEye width={18} height={18} />}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
