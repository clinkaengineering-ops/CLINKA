// features/users/components/EngineerProfilePage.tsx
"use client";
import { Avatar, Button, Card } from "@/components/UI";
import { NationalityLabel } from "@/components/NationalityLabel";
import { IconStar, IconMessage, IconBriefcase, IconClose, IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchConversations } from "@/features/messages/api/messages.api";
import useAuthStore from "@/store/authStore";
import { useEngineerById } from "../hooks/useEngineerById";

export function EngineerProfilePage({ id }: { id: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const { engineer, loading, error } = useEngineerById(id);
  const currentUser = useAuthStore((s) => s.user);
  const [messageConversationId, setMessageConversationId] = useState<
    number | null
  >(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
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

  useEffect(() => {
    if (!currentUser || isAdmin) return;
    fetchConversations()
      .then((list) => {
        const matches = list
          .filter((c) => c.participantId === id)
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime(),
          );
        if (matches[0]) setMessageConversationId(matches[0].id);
      })
      .catch(() => setMessageConversationId(null));
  }, [currentUser, id, isAdmin]);

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
        <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:items-end gap-5">
          <div className="ring-4 ring-white dark:ring-slate-900 rounded-full">
            <Avatar
              name={engineer.name}
              src={engineer.avatarUrl ?? undefined}
              size={104}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{engineer.name}</h1>
            <p className="mt-1 text-slate-500 flex flex-wrap items-center gap-1">
              <span>{profile?.specialty}</span>
              {profile?.nationality && (
                <>
                  <span>·</span>
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
                  if (messageConversationId) {
                    router.push(`/messages?c=${messageConversationId}`);
                  } else {
                    router.push(`/messages?engineer=${id}`);
                  }
                }}
              >
                {t("common.message")}
              </Button>
              {currentUser?.role === "CLIENT" && (
                <Button
                  icon={<IconBriefcase width={14} height={14} />}
                  onClick={() => router.push("/projects")}
                >
                  {t("common.hire")}
                </Button>
              )}
            </div>
          )}
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
            <Card>
              <div className="p-6 pb-0">
                <h2 className="text-lg font-bold">{t("ep.portfolio")}</h2>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {profile.portfolio.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => setActivePhotoIndex(index)}
                    className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-electric-500/50 hover:shadow-lg cursor-pointer transition duration-300"
                  >
                    <div className="h-40 relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.description}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
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

        <Card className="p-5 h-fit space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Specialty
            </p>
            <p className="mt-1 font-semibold">{profile?.specialty ?? "—"}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all duration-300">
          {/* Close button */}
          <button
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-4 end-4 z-[110] p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Close"
          >
            <IconClose width={24} height={24} />
          </button>

          {/* Left Arrow */}
          {profile.portfolio.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute start-4 z-[110] p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              aria-label="Previous"
            >
              <IconArrow width={24} height={24} className="rotate-180" />
            </button>
          )}

          {/* Image and Meta Container */}
          <div className="relative max-w-5xl w-full max-h-[85vh] px-4 flex flex-col items-center justify-center gap-4">
            <div className="relative max-w-full max-h-[70vh] rounded-xl overflow-hidden shadow-2xl bg-black/40 border border-white/5">
              <img
                src={profile.portfolio[activePhotoIndex].imageUrl}
                alt={profile.portfolio[activePhotoIndex].description}
                className="max-w-full max-h-[70vh] object-contain select-none transition-all duration-300"
              />
            </div>
            
            {/* Description & counter */}
            <div className="w-full text-center max-w-2xl px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <p className="text-white text-sm sm:text-base font-medium">
                {profile.portfolio[activePhotoIndex].description}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {activePhotoIndex + 1} of {profile.portfolio.length}
              </p>
            </div>
          </div>

          {/* Right Arrow */}
          {profile.portfolio.length > 1 && (
            <button
              onClick={goNext}
              className="absolute end-4 z-[110] p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              aria-label="Next"
            >
              <IconArrow width={24} height={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
