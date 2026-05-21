"use client";

import { Badge, Button, Card } from "@/components/UI";
import { IconCheck, IconClose } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { PendingVerification } from "../api/admin.api";

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

  return (
    <Card>
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="font-bold">{t("ad.pendingVerifications")}</h2>
        <Badge color="amber">
          {verifications.length} {t("ad.pending")}
        </Badge>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {verifications.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">{t("ad.noPending")}</p>
        ) : (
          verifications.map((v) => (
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
