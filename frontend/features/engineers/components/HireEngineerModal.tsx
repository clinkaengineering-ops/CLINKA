"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@/components/UI";
import { useI18n } from "@/i18n";
import { IconCheck, IconClose } from "@/components/Icons";
import { fetchMyOpenProjects, inviteEngineer } from "../../invitations/api/invitation.api";
import type { Project } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface HireEngineerModalProps {
  open: boolean;
  onClose: () => void;
  engineerId: number;
  engineerName: string;
  engineerSpecialty?: string | null;
}

export function HireEngineerModal({
  open,
  onClose,
  engineerId,
  engineerName,
  engineerSpecialty,
}: HireEngineerModalProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setSelectedProjectId(null);
      fetchMyOpenProjects()
        .then((data) => setProjects(data))
        .catch(() => setError("Failed to load projects"))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleInvite = async () => {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await inviteEngineer(selectedProjectId, engineerId);
      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">{t("hire.modalTitle")}</h2>
          <button
            onClick={onClose}
            className="p-2 -me-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <IconClose className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("hire.successTitle")}</h3>
              <p className="text-slate-500 mb-8">{t("hire.successDesc")}</p>
              <Button onClick={() => router.push(`/projects?id=${selectedProjectId}`)}>
                {t("hire.viewProject")}
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8 text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-6">{t("hire.noProjects")}</p>
              <Button onClick={() => router.push("/projects?create=1")}>
                {t("hire.createProject")}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-1">{t("hire.selectProject")}</h3>
                <p className="text-sm text-slate-500">{t("hire.selectProjectDesc")}</p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`p-4 cursor-pointer transition-all bg-white dark:bg-slate-800 ${
                      selectedProjectId === project.id
                        ? "border-primary ring-1 ring-primary"
                        : "hover:border-slate-300 dark:hover:border-slate-700 border-slate-200 dark:border-slate-700"
                    }`}
                    onClick={() => setSelectedProjectId(project.id)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-medium text-lg text-slate-900 dark:text-white">{project.title}</h4>
                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                          <span className="font-medium text-slate-900 dark:text-slate-300">
                            {formatCurrency(project.budget)}
                          </span>
                          <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                          <span>{t(`service.${project.serviceType.toLowerCase()}`)}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selectedProjectId === project.id ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {selectedProjectId === project.id && <IconCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {!success && projects.length > 0 && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleInvite} disabled={!selectedProjectId || isSubmitting}>
              {t("hire.sendInvitation")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
