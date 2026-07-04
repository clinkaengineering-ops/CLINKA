"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/UI";
import { IconBolt, IconClose, IconCheck } from "@/components/Icons";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { authApi } from "@/features/auth/api/auth.api";
import { getMe } from "@/features/engineers/api/engineer.api";
import { parseApiValidation } from "@/lib/validation";
import { useI18n } from "@/i18n";
import { cn } from "@/utils/cn";
import type { Me } from "@/types";

type Specialty = "CIVIL" | "ARCHITECTURAL";
type DocumentType = "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl";

const NATIONALITIES = [
  "Egyptian", "Saudi", "Emirati", "Jordanian", "Lebanese", "Kuwaiti", "Qatari",
  "Bahraini", "Omani", "Palestinian", "Iraqi", "Syrian", "Libyan", "Tunisian",
  "Moroccan", "Algerian", "Sudanese", "American", "British", "Canadian", "Other",
];

type JoinAsEngineerButtonProps = {
  size?: "lg" | "md" | "sm";
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  icon?: ReactNode;
};

export function JoinAsEngineerButton({
  size = "lg",
  variant = "secondary",
  className,
  icon = <IconBolt width={18} height={18} />,
}: JoinAsEngineerButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { authResolved, user } = useAuthHydration();
  const [open, setOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState({ title: "", body: "" });
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    specialty: "" as Specialty | "",
    nationality: "",
    bio: "",
    documentType: "" as DocumentType | "",
    file: null as File | null,
    portfolioFiles: [] as File[],
  });

  const documentOptions = [
    { type: "collegeIdUrl" as DocumentType, label: t("auth.doc.collegeId") },
    { type: "certificateUrl" as DocumentType, label: t("auth.doc.certificate") },
    { type: "syndicateCardUrl" as DocumentType, label: t("auth.doc.syndicate") },
  ];

  const resetForm = useCallback(() => {
    setForm({
      specialty: "",
      nationality: "",
      bio: "",
      documentType: "",
      file: null,
      portfolioFiles: [],
    });
    setError("");
  }, []);

  useEffect(() => {
    if (!open || user?.role !== "CLIENT") return;
    getMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, [open, user?.role]);

  const showInfo = (title: string, body: string) => {
    setMessage({ title, body });
    setMessageOpen(true);
  };

  const handleClick = async () => {
    if (!authResolved) return;

    if (!user) {
      router.push("/register?role=engineer");
      return;
    }

    if (user.role === "ENGINEER") {
      showInfo(t("joinEngineer.alreadyTitle"), t("joinEngineer.alreadyBody"));
      return;
    }

    if (user.role === "ADMIN") {
      showInfo(t("joinEngineer.adminTitle"), t("joinEngineer.adminBody"));
      return;
    }

    try {
      const profile = me?.profile ?? (await getMe()).profile;
      if (profile?.verificationStatus === "PENDING") {
        showInfo(t("joinEngineer.pendingTitle"), t("joinEngineer.pendingBody"));
        return;
      }
    } catch {
      // continue to application form
    }

    resetForm();
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.specialty || !form.nationality || !form.documentType) {
      setError(t("joinEngineer.fillRequired"));
      return;
    }
    if (!form.file) {
      setError(t("joinEngineer.documentRequired"));
      return;
    }
    if (form.portfolioFiles.length < 3) {
      setError(t("auth.portfolioMin").replace("{count}", "3"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("specialty", form.specialty);
      formData.append("nationality", form.nationality);
      formData.append("documentType", form.documentType);
      if (form.bio.trim()) formData.append("bio", form.bio.trim());
      formData.append("document", form.file);
      for (const file of form.portfolioFiles) {
        formData.append("portfolio", file);
      }

      await authApi.applyAsEngineer(formData);
      setOpen(false);
      showInfo(t("joinEngineer.submittedTitle"), t("joinEngineer.submittedBody"));
    } catch (err) {
      setError(parseApiValidation(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        icon={icon}
        className={className}
        onClick={() => void handleClick()}
        disabled={!authResolved}
      >
        {t("hero.findWork")}
      </Button>

      {messageOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setMessageOpen(false)}
              className="absolute top-4 end-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <IconClose width={18} height={18} />
            </button>
            <h3 className="text-lg font-bold pe-8">{message.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message.body}</p>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => setMessageOpen(false)}>
                {t("common.ok")}
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg p-6 space-y-4 my-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("joinEngineer.formTitle")}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <IconClose width={18} height={18} />
                </button>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("joinEngineer.formSubtitle")}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("auth.specialty")}>
                <select
                  value={form.specialty}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, specialty: e.target.value as Specialty }))
                  }
                  className="w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm border-slate-200 dark:border-slate-800"
                >
                  <option value="">{t("joinEngineer.selectSpecialty")}</option>
                  <option value="CIVIL">{t("auth.civil")}</option>
                  <option value="ARCHITECTURAL">{t("auth.architectural")}</option>
                </select>
              </Field>

              <Field label={t("auth.nationality")}>
                <select
                  value={form.nationality}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nationality: e.target.value }))
                  }
                  className="w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm border-slate-200 dark:border-slate-800"
                >
                  <option value="">{t("joinEngineer.selectNationality")}</option>
                  {NATIONALITIES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t("auth.bio")}>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("joinEngineer.documentType")}>
                <select
                  value={form.documentType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, documentType: e.target.value as DocumentType }))
                  }
                  className="w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm border-slate-200 dark:border-slate-800"
                >
                  <option value="">{t("joinEngineer.documentType")}</option>
                  {documentOptions.map((opt) => (
                    <option key={opt.type} value={opt.type}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={t("joinEngineer.uploadDocument")}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      file: e.target.files?.[0] ?? null,
                    }))
                  }
                  className="block w-full text-sm mt-2"
                />
              </Field>
            </div>

            <Field label={t("auth.portfolioStep")}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    portfolioFiles: Array.from(e.target.files ?? []),
                  }))
                }
                className="block w-full text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                {t("auth.portfolioMin").replace("{count}", "3")} ·{" "}
                {form.portfolioFiles.length} / 3+
              </p>
            </Field>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                {t("common.cancel")}
              </Button>
              <Button
                icon={<IconCheck width={14} height={14} />}
                onClick={() => void handleSubmit()}
                disabled={loading}
              >
                {loading ? t("common.loading") : t("joinEngineer.submit")}
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </>
  );
}
