// features/users/components/EngineerProfilePage.tsx
"use client";
import { Avatar, Button, Card } from "@/components/UI";
import { NationalityLabel } from "@/components/NationalityLabel";
import { IconStar, IconMessage, IconBriefcase, IconClose, IconArrow, IconFile } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { useEngineerById } from "../hooks/useEngineerById";
import { HireEngineerModal } from "./HireEngineerModal";

export function EngineerProfilePage({ id }: { id: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const { engineer, loading, error } = useEngineerById(id);
  const currentUser = useAuthStore((s) => s.user);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const isAdmin = currentUser?.role === "ADMIN";

  const goPrev = () => {
    const portfolio = engineer?.profile?.portfolio;
    if (!portfolio) return;
    setActivePhotoIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? portfolio.length - 1 : prev - 1;
    });
  };

  const goNext = () => {
    const portfolio = engineer?.profile?.portfolio;
    if (!portfolio) return;
    setActivePhotoIndex((prev) => {
      if (prev === null) return null;
      return prev === portfolio.length - 1 ? 0 : prev + 1;
    });
  };

  useEffect(() => {
    if (activePhotoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "ArrowRight") {
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhotoIndex, engineer?.profile?.portfolio]);



  if (loading) {
    return (
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
  }

  if (error || !engineer) {
    return (
      <div className="text-center py-20 text-rose-500">
        {error || "Engineer not found"}
      </div>
    );
  }

  const { profile } = engineer;
  const completed = engineer.completedProjects ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Card className="overflow-hidden">
        <div
          className="h-40 relative bg-gradient-to-br from-navy-900 via-navy-800 to-electric-700"
          style={
            profile?.coverImageUrl
              ? {
                  backgroundImage: `url(${profile.coverImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {!profile?.coverImageUrl && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.4),_transparent_50%)]" />
          )}
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-5">
            <div className="ring-4 ring-white dark:ring-slate-900 rounded-full w-max">
              <Avatar
                name={engineer.name}
                src={engineer.avatarUrl ?? undefined}
                size={104}
              />
            </div>
            {!isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  icon={<IconMessage width={14} height={14} />}
                  onClick={() => {
                    if (!currentUser) {
                      router.push(`/login?next=/engineers/${id}`);
                      return;
                    }
                    router.push(`/messages?user=${id}`);
                  }}
                >
                  {t("common.message")}
                </Button>
                {currentUser?.role !== "ENGINEER" && (
                  <Button
                    icon={<IconBriefcase width={14} height={14} />}
                    onClick={() => {
                      if (!currentUser) {
                        router.push(`/login?next=/engineers/${id}`);
                        return;
                      }
                      setHireModalOpen(true);
                    }}
                  >
                    {t("common.hire")}
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{engineer.name}</h1>
            <p className="mt-1 text-slate-500 flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {profile?.professionalHeadline || profile?.specialty}
              </span>
              {profile?.nationality && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <NationalityLabel nationality={profile.nationality} />
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <IconStar width={14} height={14} className="text-amber-500" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {profile?.averageRating?.toFixed(1) ?? "0.0"}
                </span>
                <span>
                  ({profile?.totalReviews ?? 0} {t("common.reviews")})
                </span>
              </span>
              <span className="text-slate-400">·</span>
              <span>
                {completed} {completed === 1 ? "project" : "projects"} completed
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">{t("ep.about")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
              {profile?.bio || "No bio yet."}
            </p>
          </Card>

          {profile?.portfolio && profile.portfolio.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-navy-950 border border-slate-200 dark:border-navy-800/60 overflow-hidden">
              {/* Section header */}
              <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("ep.portfolio")}</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-electric-500/40 to-transparent" />
                <span className="text-xs font-medium text-slate-400">
                  {profile.portfolio.length} {profile.portfolio.length === 1 ? "project" : "projects"}
                </span>
              </div>

              {/* 3-column responsive grid */}
              <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {profile.portfolio.map((item, index) => {
                  const url = item.coverImageUrl || item.imageUrl || "";
                  const isPdf = url.toLowerCase().split("?")[0].endsWith(".pdf");
                  const categoryTag = profile.specialty === "ARCHITECTURAL"
                    ? "Architectural"
                    : profile.specialty === "CIVIL"
                      ? "Structural"
                      : "Engineering";

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActivePhotoIndex(index)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-navy-800/80 bg-slate-50 dark:bg-navy-900/60 cursor-pointer transition-all duration-300 hover:border-electric-500/40 hover:shadow-[0_0_30px_-5px_rgba(25,100,129,0.15)]"
                    >
                      {/* 16:9 thumbnail area */}
                      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-navy-900">
                        {isPdf ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-navy-900">
                            <div className="w-14 h-14 rounded-xl bg-electric-500/10 flex items-center justify-center">
                              <IconFile width={28} height={28} className="text-electric-400" />
                            </div>
                            <span className="text-xs font-bold tracking-wider uppercase text-electric-400">PDF Document</span>
                          </div>
                        ) : (
                          <img
                            src={url || "/placeholder.png"}
                            alt={item.description}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-navy-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="px-5 py-2.5 rounded-lg bg-electric-500 text-white text-sm font-semibold shadow-lg shadow-electric-500/25 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            {isPdf ? "View PDF" : "View Project"}
                          </span>
                        </div>
                      </div>

                      {/* Card info */}
                      <div className="p-4 space-y-2">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-copper/15 text-brand-copper border border-brand-copper/20">
                          {isPdf ? "Document" : categoryTag}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {profile?.reviews && profile.reviews.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("ep.reviews")}</h2>
                <div className="flex items-center gap-1 text-sm">
                  <IconStar width={16} height={16} className="text-amber-500" />
                  <span className="font-bold">
                    {profile.averageRating?.toFixed(1)}
                  </span>
                  <span className="text-slate-500">
                    · {profile.totalReviews} {t("common.reviews")}
                  </span>
                </div>
              </div>
              <div className="mt-6 space-y-5">
                {profile.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, k) => (
                          <IconStar
                            key={k}
                            width={12}
                            height={12}
                            className="text-amber-500 fill-amber-500"
                          />
                        ))}
                      </div>
                      {r.client?.name && (
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {r.client.name}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <Card className="p-5 h-fit space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Availability
            </p>
            <p className="mt-1 font-semibold text-sm">
              {profile?.availabilityStatus ? profile.availabilityStatus.replace(/_/g, " ") : "AVAILABLE NOW"}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hourly Rate
              </p>
              <p className="mt-1 font-semibold">
                {profile?.hourlyRateUSD ? `$${profile.hourlyRateUSD}/hr` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Starting Budget
              </p>
              <p className="mt-1 font-semibold">
                {profile?.startingProjectPriceUSD ? `$${profile.startingProjectPriceUSD}+` : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Experience
              </p>
              <p className="mt-1 font-semibold">
                {profile?.yearsOfExperience ? `${profile.yearsOfExperience} Years` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Specialty
              </p>
              <p className="mt-1 font-semibold">{profile?.specialty ?? "—"}</p>
            </div>
          </div>

          {profile?.nationality && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("em.nationality")}
              </p>
              <p className="mt-1 font-semibold">
                <NationalityLabel nationality={profile.nationality} />
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Completed projects
            </p>
            <p className="mt-1 text-2xl font-bold text-electric-600">
              {completed}
            </p>
          </div>
        </Card>
      </div>

      {activePhotoIndex !== null && profile?.portfolio && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-xl transition-all duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) setActivePhotoIndex(null); }}
        >
          {/* Close button */}
          <button
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-5 end-5 z-[110] p-3 rounded-full bg-navy-800/60 text-white/80 hover:bg-navy-700/80 hover:text-white border border-navy-700/50 backdrop-blur-sm transition-all cursor-pointer"
            aria-label="Close"
          >
            <IconClose width={20} height={20} />
          </button>

          {/* Left Arrow */}
          {profile.portfolio.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute start-4 z-[110] p-3 rounded-full bg-navy-800/60 text-white/80 hover:bg-electric-500/20 hover:text-electric-400 border border-navy-700/50 backdrop-blur-sm transition-all cursor-pointer"
              aria-label="Previous"
            >
              <IconArrow width={22} height={22} className="rotate-180" />
            </button>
          )}

          {/* Content container */}
          <div className="relative max-w-6xl w-full max-h-[90vh] px-4 flex flex-col items-center justify-center gap-4">
            {(() => {
              const activeItem = profile.portfolio[activePhotoIndex];
              const activeUrl = activeItem.coverImageUrl || activeItem.imageUrl || "";
              const isPdf = activeUrl.toLowerCase().split("?")[0].endsWith(".pdf");
              return (
                <div className="relative max-w-full w-full h-[72vh] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 bg-navy-900 border border-navy-800/60">
                  {isPdf ? (
                    <iframe
                      src={activeUrl}
                      className="w-full h-full bg-white rounded-2xl"
                      title={activeItem.description}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={activeUrl || "/placeholder.png"}
                        alt={activeItem.description}
                        className="max-w-full max-h-[72vh] object-contain select-none"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Description footer */}
            <div className="w-full max-w-2xl">
              <div className="h-px bg-gradient-to-r from-transparent via-electric-500/30 to-transparent mb-3" />
              <div className="flex items-center justify-between gap-4 px-2">
                <p className="text-white/90 text-sm sm:text-base font-medium flex-1 text-center">
                  {profile.portfolio[activePhotoIndex].description}
                </p>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800/80 text-slate-400 border border-navy-700/50">
                  {activePhotoIndex + 1} / {profile.portfolio.length}
                </span>
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          {profile.portfolio.length > 1 && (
            <button
              onClick={goNext}
              className="absolute end-4 z-[110] p-3 rounded-full bg-navy-800/60 text-white/80 hover:bg-electric-500/20 hover:text-electric-400 border border-navy-700/50 backdrop-blur-sm transition-all cursor-pointer"
              aria-label="Next"
            >
              <IconArrow width={22} height={22} />
            </button>
          )}
        </div>
      )}

      <HireEngineerModal
        open={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
        engineerId={id}
        engineerName={engineer.name}
        engineerSpecialty={profile?.specialty}
      />
    </div>
  );
}
