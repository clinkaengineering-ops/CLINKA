"use client";

import { Badge, Button, Card } from "@/components/UI";
import { IconCheck, IconClose } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { isReviewableVerification, type PendingVerification } from "../api/admin.api";

interface Props {
  verifications: PendingVerification[];
  actionLoading: number | null;
  onApprove: (profileId: number) => void;
  onReject: (profileId: number) => void;
}

export function AdminVerificationList({
  verifications,
  actionLoading,
  onApprove,
  onReject,
}: Props) {
  const { t } = useI18n();
  const reviewable = verifications.filter(isReviewableVerification);

  return (
    <Card>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold">{t("ad.pendingVerifications")}</h2>
        <Badge color="amber">
          {reviewable.length} {t("ad.pending")}
        </Badge>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {reviewable.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{t("ad.noPending")}</p>
        ) : (
          reviewable.map((v) => (
            <div
              key={v.profileId}
              className="p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <p className="font-semibold text-sm">{v.name}</p>
                <p className="text-xs text-slate-500">
                  {v.email} · {v.specialty} · {v.documentType}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {v.collegeIdUrl && (
                    <a
                      href={v.collegeIdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-electric-600 hover:underline"
                    >
                      College ID
                    </a>
                  )}
                  {v.certificateUrl && (
                    <a
                      href={v.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-electric-600 hover:underline"
                    >
                      Certificate
                    </a>
                  )}
                  {v.syndicateCardUrl && (
                    <a
                      href={v.syndicateCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-electric-600 hover:underline"
                    >
                      Syndicate
                    </a>
                  )}
                </div>
                {v.portfolios && v.portfolios.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                      {t("auth.portfolioStep") || "Portfolios"}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 max-w-[300px] sm:max-w-md">
                      {v.portfolios.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 w-16 h-16 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:opacity-80 transition"
                        >
                          <img
                            src={url}
                            alt={`Portfolio ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  icon={<IconCheck width={14} height={14} />}
                  disabled={actionLoading === v.profileId}
                  onClick={() => onApprove(v.profileId)}
                >
                  {t("ad.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={<IconClose width={14} height={14} />}
                  disabled={actionLoading === v.profileId}
                  onClick={() => onReject(v.profileId)}
                >
                  {t("ad.reject")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
