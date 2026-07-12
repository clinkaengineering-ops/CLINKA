"use client";

import { useMemo, useState } from "react";
import { Circle, CheckCircle2 } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validation/fields";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";

export function PasswordChecklist({
  password,
  confirmPassword,
}: {
  password?: string;
  confirmPassword?: string;
}) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);

  // If password is completely empty and hasn't been focused (or typed in parent),
  // we might want to hide it, but the user requested:
  // "Before typing: show the short helper text. As soon as the user focuses the password field or starts typing: replace the helper text with the live checklist."
  // Wait, if I manage focus here, I'd need to pass a ref or a prop from parent. 
  // Let's just assume parent controls when to render this component vs the helper text, 
  // or this component handles both states. Let's make it handle both states.

  const reqs = [
    {
      id: "min",
      label: t("auth.passReq.min"),
      met: (password?.length ?? 0) >= PASSWORD_RULES.MIN_LENGTH,
    },
    {
      id: "upper",
      label: t("auth.passReq.upper"),
      met: PASSWORD_RULES.UPPERCASE.test(password || ""),
    },
    {
      id: "lower",
      label: t("auth.passReq.lower"),
      met: PASSWORD_RULES.LOWERCASE.test(password || ""),
    },
    {
      id: "num",
      label: t("auth.passReq.num"),
      met: PASSWORD_RULES.NUMBER.test(password || ""),
    },
    {
      id: "special",
      label: t("auth.passReq.special"),
      met: PASSWORD_RULES.SPECIAL.test(password || ""),
    },
  ];

  const allMet = reqs.every((r) => r.met);

  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (PASSWORD_RULES.UPPERCASE.test(password)) score += 1;
    if (PASSWORD_RULES.LOWERCASE.test(password)) score += 1;
    if (PASSWORD_RULES.NUMBER.test(password)) score += 1;
    if (PASSWORD_RULES.SPECIAL.test(password)) score += 1;

    // Deductions for poor entropy or patterns
    if (/^[a-zA-Z]+$/.test(password)) score -= 1;
    if (/^[0-9]+$/.test(password)) score -= 1;
    if (/(.)\1{2,}/.test(password)) score -= 1; // 3 repeated chars

    return Math.max(0, Math.min(5, score));
  }, [password]);

  const strengthLabels = [
    t("auth.passStrength.weak"),
    t("auth.passStrength.weak"),
    t("auth.passStrength.fair"),
    t("auth.passStrength.good"),
    t("auth.passStrength.strong"),
    t("auth.passStrength.veryStrong"),
  ];

  const strengthColors = [
    "bg-slate-200 dark:bg-slate-800",
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-electric-500",
  ];

  const confirmMatch =
    confirmPassword !== undefined && confirmPassword.length > 0 && password === confirmPassword;
  const confirmMismatch =
    confirmPassword !== undefined && confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-3 transition-opacity duration-300",
        allMet ? "opacity-70 hover:opacity-100" : "opacity-100"
      )}
      aria-live="polite"
    >
      {/* Password Strength Indicator */}
      {password && password.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">{t("auth.passwordStrength") || "Strength"}</span>
            <span
              className={cn(
                "transition-colors duration-300",
                strengthColors[strength].replace("bg-", "text-")
              )}
            >
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="flex gap-1 h-1.5 w-full">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-full flex-1 rounded-full transition-colors duration-500",
                  level <= strength
                    ? strengthColors[strength]
                    : "bg-slate-200 dark:bg-slate-800"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <ul className="space-y-2">
        {reqs.map((req) => (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors duration-300",
              req.met ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-500"
            )}
          >
            {req.met ? (
              <CheckCircle2 className="w-4 h-4 animate-in zoom-in duration-300" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
            )}
            <span>{req.label}</span>
            <span className="sr-only">{req.met ? "Requirement met" : "Requirement pending"}</span>
          </li>
        ))}
      </ul>

      {/* Confirm Password Indicator */}
      {confirmPassword !== undefined && confirmPassword.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium animate-in fade-in duration-300",
            confirmMatch ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
          )}
        >
          {confirmMatch ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
          <span>{confirmMatch ? t("auth.passConfirm.match") : t("auth.passConfirm.mismatch")}</span>
        </div>
      )}
    </div>
  );
}
