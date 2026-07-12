"use client";

import { useEffect, useState } from "react";
import { Button, Card, Spinner, Avatar, Badge } from "@/components/UI";
import { useI18n } from "@/i18n";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { fetchMyInvitations, markInvitationViewed, respondToInvitation, ProjectInvitation } from "../../invitations/api/invitation.api";
import { IconBriefcase, IconCheck, IconClose } from "@/components/Icons";
import { useRouter } from "next/navigation";

export default function InvitationsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ACCEPTED" | "DECLINED" | "CLOSED">("PENDING");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await fetchMyInvitations();
      setInvitations(data);
      // Mark pending as viewed
      data.filter(inv => inv.status === "PENDING").forEach(inv => {
        markInvitationViewed(inv.id).catch(() => {});
      });
    } catch (e) {
      setError("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: number, action: "ACCEPT" | "DECLINE") => {
    try {
      setActionLoading(id);
      await respondToInvitation(id, action);
      await loadInvitations();
      if (action === "ACCEPT") {
        const inv = invitations.find(i => i.id === id);
        if (inv) router.push(`/messages?project=${inv.projectId}`);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInvitations = invitations.filter(inv => {
    if (activeTab === "CLOSED") return ["EXPIRED", "CANCELLED"].includes(inv.status);
    return inv.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge color="amber">{t("inv.pending")}</Badge>;
      case "ACCEPTED": return <Badge color="green">{t("inv.accepted")}</Badge>;
      case "DECLINED": return <Badge color="rose">{t("inv.declined")}</Badge>;
      case "CANCELLED": return <Badge color="slate">{t("inv.cancelled")}</Badge>;
      case "EXPIRED": return <Badge color="slate">{t("inv.expired")}</Badge>;
      default: return <Badge color="slate">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("inv.title")}</h1>
        <p className="text-text-muted mt-2">{t("inv.subtitle")}</p>
      </div>

      <div className="flex gap-4 border-b border-border/40 mb-6 overflow-x-auto pb-2">
        {(["PENDING", "ACCEPTED", "DECLINED", "CLOSED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-text hover:border-border"
            }`}
          >
            {t(`inv.tab_${tab.toLowerCase()}`)}
            <span className="ms-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
              {invitations.filter(i => tab === "CLOSED" ? ["EXPIRED", "CANCELLED"].includes(i.status) : i.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-500/10 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      {filteredInvitations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <IconBriefcase className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t("inv.empty")}</h3>
          <p className="text-slate-500 max-w-sm">{t("inv.emptyDesc")}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInvitations.map((inv) => (
            <Card key={inv.id} className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{inv.project?.title}</h3>
                        {getStatusBadge(inv.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <Avatar size={20} name={inv.client?.name || ""} src={inv.client?.avatarUrl || undefined} />
                          <span className="font-medium">{inv.client?.name}</span>
                        </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(inv.project?.budget || 0)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{t(`service.${inv.project?.serviceType.toLowerCase()}`)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>{formatDate(inv.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                  {inv.status === "PENDING" && (
                    <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 w-max px-3 py-1.5 rounded-lg">
                      <span className="font-medium">{t("hire.expiresIn").replace("{days}", String(Math.max(1, Math.ceil((new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))))}</span>
                      <span>({formatDate(inv.expiresAt)})</span>
                    </div>
                  )}
                </div>

                {inv.status === "PENDING" && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => handleRespond(inv.id, "DECLINE")}
                      disabled={actionLoading !== null}
                      icon={<IconClose className="w-4 h-4" />}
                      className="w-full sm:w-auto hover:bg-red-500/10 hover:text-red-500"
                    >
                      {t("inv.decline")}
                    </Button>
                    <Button
                      onClick={() => handleRespond(inv.id, "ACCEPT")}
                      disabled={actionLoading !== null}
                      icon={<IconCheck className="w-4 h-4" />}
                      className="w-full sm:w-auto"
                    >
                      {t("inv.accept")}
                    </Button>
                  </div>
                )}
                
                {inv.status === "ACCEPTED" && (
                  <div className="flex items-center gap-3 shrink-0">
                    <Button onClick={() => router.push(`/messages?project=${inv.projectId}`)}>
                      {t("common.message")}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
