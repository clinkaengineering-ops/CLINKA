"use client";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, VerifiedBadge } from "@/components/UI";
import { IconStar, IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { Engineer } from "@/types";

export function EngineerCard({ engineer }: { engineer: Engineer }) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <Card className="p-5 hover:-translate-y-1 hover:border-electric-500/40 hover:shadow-xl hover:shadow-electric-500/10 transition group">
      <div className="flex items-start gap-4">
        <Avatar name={engineer.name} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold truncate">{engineer.name}</p>
            {engineer.profile?.verificationStatus === "APPROVED" && <VerifiedBadge size={16} />}
          </div>
          <p className="text-xs text-slate-500">{engineer.profile?.specialty}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <IconStar width={12} height={12} className="text-amber-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {engineer.profile?.averageRating?.toFixed(1) ?? "0.0"}
            </span>
            <span>({engineer.profile?.totalReviews ?? 0} {t("common.reviews")})</span>
          </div>
        </div>
      </div>

      {engineer.profile?.bio && (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {engineer.profile.bio}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <Badge color="electric">{engineer.profile?.specialty}</Badge>
        <Button
          size="sm"
          onClick={() => router.push(`/engineers/${engineer.id}`)}
          icon={<IconArrow width={14} height={14} />}
        >
          {t("common.viewProfile")}
        </Button>
      </div>
    </Card>
  );
}
