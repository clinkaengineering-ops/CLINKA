"use client";
import { Avatar, Badge, Button, Card, Progress, VerifiedBadge } from "@/components/UI";
import { IconStar, IconMessage, IconBriefcase, IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useEngineerById } from "../hooks/useEngineerById";

export function EngineerProfilePage({ id }: { id: number }) {
  const { t } = useI18n();
  const { engineer, loading, error } = useEngineerById(id);

  if (loading) return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <Card className="overflow-hidden">
        <div className="h-40 bg-slate-200 dark:bg-slate-800" />
        <div className="px-6 pb-6 -mt-12 flex gap-5">
          <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 pt-14 space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          </div>
        </div>
      </Card>
    </div>
  );

  if (error || !engineer) return (
    <div className="text-center py-20 text-rose-500">{error || "Engineer not found"}</div>
  );

  const { profile } = engineer;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cover */}
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-navy-900 via-navy-800 to-electric-700 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.4),_transparent_50%)]" />
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:items-end gap-5">
          <div className="ring-4 ring-white dark:ring-slate-900 rounded-full">
            <Avatar name={engineer.name} size={104} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{engineer.name}</h1>
              {profile?.verificationStatus === "APPROVED" && <VerifiedBadge size={18} />}
            </div>
            <p className="mt-1 text-slate-500">{profile?.specialty}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <IconStar width={14} height={14} className="text-amber-500" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {profile?.averageRating?.toFixed(1) ?? "0.0"}
              </span>
              <span>({profile?.totalReviews ?? 0} {t("common.reviews")})</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<IconMessage width={14} height={14} />}>
              {t("common.message")}
            </Button>
            <Button icon={<IconBriefcase width={14} height={14} />}>
              {t("common.hire")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* About */}
          {profile?.bio && (
            <Card className="p-6">
              <h2 className="text-lg font-bold">{t("ep.about")}</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{profile.bio}</p>
            </Card>
          )}

          {/* Portfolio */}
          {profile?.portfolio && profile.portfolio.length > 0 && (
            <Card>
              <div className="p-6 pb-0">
                <h2 className="text-lg font-bold">{t("ep.portfolio")}</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {profile.portfolio.map(item => (
                  <div key={item.id} className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-electric-500/50 transition">
                    <div className="h-40 bg-gradient-to-br from-electric-500 to-navy-700 relative">
                      <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reviews */}
          {profile?.reviews && profile.reviews.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("ep.reviews")}</h2>
                <div className="flex items-center gap-1 text-sm">
                  <IconStar width={16} height={16} className="text-amber-500" />
                  <span className="font-bold">{profile.averageRating?.toFixed(1)}</span>
                  <span className="text-slate-500">· {profile.totalReviews} {t("common.reviews")}</span>
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {profile.reviews.map(r => (
                  <div key={r.id} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(r.rating)].map((_, k) => (
                          <IconStar key={k} width={12} height={12} className="text-amber-500" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-bold text-sm">{t("ep.verifications")}</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { label: t("ep.v1"), done: !!profile?.collegeIdUrl },
                { label: t("ep.v2"), done: !!profile?.certificateUrl },
                { label: t("ep.v3"), done: !!profile?.syndicateCardUrl },
              ].map(v => (
                <div key={v.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${v.done ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                    <IconCheck width={14} height={14} />
                  </span>
                  {v.label}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Specialty</p>
            <p className="mt-2 font-semibold">{profile?.specialty}</p>
            <p className="mt-1 text-xs text-slate-500">
              Status: <span className={profile?.verificationStatus === "APPROVED" ? "text-emerald-600" : "text-amber-600"}>{profile?.verificationStatus}</span>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
