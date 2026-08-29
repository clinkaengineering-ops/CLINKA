"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, Button } from "@/components/UI";
import { IconMail } from "@/components/Icons";
import { useI18n } from "@/i18n";

export function CheckEmailForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <Card className="p-6 sm:p-8">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-electric-100 text-electric-600 dark:bg-electric-900/40 dark:text-electric-400 flex items-center justify-center mx-auto">
          <IconMail width={22} height={22} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t("auth.checkEmail.title")}
        </h1>
        <p className="text-sm text-slate-500">
          {t("auth.checkEmail.subtitle")}
        </p>
        {email && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
            {email}
          </p>
        )}
        <p className="text-sm text-slate-500">{t("auth.checkEmail.hint")}</p>
        <Link href="/login" className="block pt-2">
          <Button variant="secondary" className="w-full">
            {t("auth.signInLink")}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
