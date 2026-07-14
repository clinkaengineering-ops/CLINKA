"use client";

import { useEffect, useState } from "react";
import { Button, Card, Spinner, Badge } from "@/components/UI";
import { useI18n } from "@/i18n";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cancelInvitation, fetchProjectInvitations, ProjectInvitation } from "../../invitations/api/invitation.api";

export function ProjectInvitationsPanel({ projectId }: { projectId: number }) {
  const { t } = useI18n();
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectInvitations(projectId);
      setInvitations(data);
    } catch (e) {
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const handleCancel = async (id: number) => {
    try {
      setActionLoading(id);
      await cancelInvitation(id);
      await loadInvitations();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to cancel invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING": return "amber";
      case "ACCEPTED": return "green";
      case "DECLINED": return "rose";
      case "CANCELLED": return "slate";
      case "EXPIRED": return "slate";
      default: return "slate";
    }
  };

  if (loading) {
    return <div className="py-8 flex justify-center"><Spinner /></div>;
  }

  if (invitations.length === 0) {
    return null; // Don't show the panel if there are no invitations
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">{t("inv.title")}</h3>
        <Badge color="slate">
          {invitations.length} {t("inv.total")}
        </Badge>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/60 rounded-xl">
          <p className="text-slate-500">{t("inv.noInvitations")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-border/40">
              <div className="flex gap-4 items-center min-w-[200px]">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  {inv.engineer?.avatarUrl ? (
                    <img src={inv.engineer.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 font-bold text-sm">
                      {inv.engineer?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{inv.engineer?.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t("inv.sentOn")} {formatDate(inv.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Badge color={getStatusBadgeColor(inv.status) as any}>
                  {t(`inv.status_${inv.status.toLowerCase()}`)}
                </Badge>

                {inv.status === "PENDING" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(inv.id)}
                    disabled={actionLoading !== null}
                    className="hover:text-red-500"
                  >
                    {t("inv.cancel")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
