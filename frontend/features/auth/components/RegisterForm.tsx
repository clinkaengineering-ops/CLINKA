"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { startGoogleSignIn } from "@/features/auth/lib/googleAuth";
import { getMe } from "@/features/engineers/api/engineer.api";
import useAuthStore from "@/store/authStore";
import {
  clientRegisterFormSchema,
  engineerRegisterStep2Schema,
  engineerRegisterStep4Schema,
  engineerResumePortfolioSchema,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { cn } from "@/utils/cn";
import { Button, Card, Divider, Field, Input, Textarea } from "@/components/UI";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordChecklist } from "@/components/PasswordChecklist";
import {
  IconArrow,
  IconBriefcase,
  IconCheck,
  IconLock,
  IconMail,
  IconUser,
} from "@/components/Icons";
import { useI18n } from "@/i18n";

type Role = "CLIENT" | "ENGINEER";
type Specialty = "CIVIL" | "ARCHITECTURAL";
type DocumentType = "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "Argentine", "Armenian", "Australian",
  "Austrian", "Azerbaijani", "Bangladeshi", "Belarusian", "Belgian", "Bolivian",
  "Bosnian", "Brazilian", "British", "Bulgarian", "Cambodian", "Cameroonian",
  "Canadian", "Chilean", "Chinese", "Colombian", "Congolese", "Croatian", "Cuban",
  "Czech", "Danish", "Dutch", "Ecuadorian", "Egyptian", "Emirati", "English",
  "Estonian", "Ethiopian", "Finnish", "French", "Georgian", "German", "Ghanaian",
  "Greek", "Guatemalan", "Hungarian", "Indian", "Indonesian", "Iranian", "Iraqi",
  "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jordanian", "Kazakh",
  "Kenyan", "Kuwaiti", "Lebanese", "Libyan", "Lithuanian", "Malaysian", "Mexican",
  "Mongolian", "Moroccan", "Nepalese", "New Zealander", "Nigerian", "Norwegian",
  "Omani", "Pakistani", "Palestinian", "Peruvian", "Philippine", "Polish",
  "Portuguese", "Qatari", "Romanian", "Russian", "Saudi", "Scottish", "Serbian",
  "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean",
  "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian", "Taiwanese",
  "Tanzanian", "Thai", "Tunisian", "Turkish", "Ukrainian", "Uruguayan", "American",
  "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zimbabwean", "Other",
];

export function RegisterForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const { registerClient, registerEngineer, resumeEngineer, completeGoogleEngineer, checkEmail, loading, error } =
    useRegister();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [resumeMode, setResumeMode] = useState(false);
  const [googleMode, setGoogleMode] = useState(false);
  const [existingPortfolioCount, setExistingPortfolioCount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "" as Specialty,
    bio: "",
    nationality: "",
    documentType: "" as DocumentType,
    file: null as File | null,
    portfolioFiles: [] as File[],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [passFocus, setPassFocus] = useState(false);

  useEffect(() => {
    const preset = searchParams.get("role");
    const stepParam = searchParams.get("step");
    const google = searchParams.get("google");

    if (preset === "engineer") {
      setRole("ENGINEER");
      if (stepParam === "3") {
        setStep(3);
      } else {
        setStep(2);
      }
      if (google === "1") {
        setGoogleMode(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!googleMode || step !== 3) return;

    let cancelled = false;

    async function hydrateGoogleSession() {
      try {
        const me = await getMe();
        if (cancelled) return;
        setUser(me);
        setForm((prev) => ({
          ...prev,
          name: me.name ?? prev.name,
          email: me.email ?? prev.email,
          specialty: (me.profile?.specialty as Specialty) ?? prev.specialty,
          bio: me.profile?.bio ?? prev.bio,
          nationality: me.profile?.nationality ?? prev.nationality,
        }));
      } catch {
        if (!cancelled) {
          setGoogleMode(false);
          setStep(2);
        }
      }
    }

    void hydrateGoogleSession();
    return () => {
      cancelled = true;
    };
  }, [googleMode, step, setUser]);

  const totalSteps = resumeMode ? 2 : googleMode ? 1 : role === "CLIENT" ? 2 : 3;
  const stepLabels = resumeMode
    ? [t("auth.s1"), t("auth.portfolioResumeTitle")]
    : googleMode
      ? [t("auth.portfolioStep")]
      : role === "CLIENT"
        ? [t("auth.s1"), t("auth.s2details")]
        : [t("auth.s1"), t("auth.s2details"), t("auth.portfolioStep")];
  const displayStep = googleMode ? 1 : step;
  const displayStepLabel = googleMode ? stepLabels[0] : stepLabels[step - 1];

  const documentOptions = [
    { type: "collegeIdUrl" as DocumentType, label: t("auth.doc.collegeId") },
    { type: "certificateUrl" as DocumentType, label: t("auth.doc.certificate") },
    { type: "syndicateCardUrl" as DocumentType, label: t("auth.doc.syndicate") },
  ];

  const portfolioRequired = resumeMode
    ? Math.max(3 - existingPortfolioCount, 0)
    : 3;
  const portfolioReady = form.portfolioFiles.length >= portfolioRequired;

  async function inspectEmail(email: string) {
    if (!email.includes("@")) return;
    try {
      const status = await checkEmail(email);
      if (status.status === "resume_engineer") {
        setResumeMode(true);
        setRole("ENGINEER");
        setExistingPortfolioCount(status.portfolioCount);
        setStep(2);
        setFieldErrors({});
      } else if (status.status === "exists") {
        setResumeMode(false);
        setFieldErrors({
          email: t("auth.emailExists"),
        });
      } else {
        setResumeMode(false);
        setExistingPortfolioCount(0);
        if (fieldErrors.email === t("auth.emailExists")) {
          setFieldErrors((prev) => {
            const next = { ...prev };
            delete next.email;
            return next;
          });
        }
      }
    } catch {
      /* ignore probe errors */
    }
  }

  function validateCurrentStep(): boolean {
    if (step === 1) {
      if (!role) {
        setFieldErrors({ _form: t("auth.selectRole") });
        return false;
      }
      setFieldErrors({});
      return true;
    }

    if (step === 2 && resumeMode) {
      const base = validateForm(
        engineerResumePortfolioSchema.pick({ email: true, password: true }),
        { email: form.email, password: form.password },
      );
      if (!base.success) {
        setFieldErrors(base.errors);
        return false;
      }
      if (form.portfolioFiles.length < portfolioRequired) {
        setFieldErrors({
          portfolioFiles: t("auth.portfolioMin").replace("{count}", String(portfolioRequired)),
        });
        return false;
      }
      setFieldErrors({});
      return true;
    }

    if (step === 2) {
      if (role === "CLIENT") {
        const result = validateForm(clientRegisterFormSchema, form);
        if (!result.success) {
          setFieldErrors(result.errors);
          return false;
        }
      } else {
        const result = validateForm(engineerRegisterStep2Schema, {
          name: form.name,
          email: form.email,
          password: form.password,
          specialty: form.specialty || undefined,
          bio: form.bio || undefined,
          nationality: form.nationality || undefined,
        });
        if (!result.success) {
          setFieldErrors(result.errors);
          return false;
        }
      }
      setFieldErrors({});
      return true;
    }

    if (step === 3 && role === "ENGINEER") {
      const result = validateForm(engineerRegisterStep4Schema, {
        documentType: form.documentType || undefined,
        file: form.file ?? undefined,
        portfolioFiles: form.portfolioFiles,
      });
      if (!result.success) {
        setFieldErrors(result.errors);
        return false;
      }
      if (googleMode) {
        const profileResult = validateForm(
          engineerRegisterStep2Schema.pick({
            specialty: true,
            nationality: true,
            bio: true,
          }),
          {
            specialty: form.specialty || undefined,
            nationality: form.nationality || undefined,
            bio: form.bio || undefined,
          },
        );
        if (!profileResult.success) {
          setFieldErrors(profileResult.errors);
          return false;
        }
      }
      setFieldErrors({});
      return true;
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (step === 2 && role === "CLIENT") {
      void handleDone();
      return;
    }
    setStep(step + 1);
  }

  function handleGoogleSignIn() {
    if (!role) return;

    if (role === "ENGINEER") {
      const result = validateForm(
        engineerRegisterStep2Schema.pick({
          specialty: true,
          nationality: true,
          bio: true,
        }),
        {
          specialty: form.specialty || undefined,
          nationality: form.nationality || undefined,
          bio: form.bio || undefined,
        },
      );
      if (!result.success) {
        setFieldErrors(result.errors);
        return;
      }

      startGoogleSignIn({
        role: "ENGINEER",
        next: "/register?role=engineer&step=3&google=1",
        specialty: form.specialty,
        nationality: form.nationality,
        ...(form.bio.trim() ? { bio: form.bio.trim() } : {}),
      });
      return;
    }

    startGoogleSignIn({ role: "CLIENT" });
  }

  async function handleDone() {
    if (!validateCurrentStep()) return;

    if (googleMode) {
      await completeGoogleEngineer({
        specialty: form.specialty,
        bio: form.bio,
        nationality: form.nationality,
        documentType: form.documentType,
        file: form.file!,
        portfolioFiles: form.portfolioFiles,
      });
      return;
    }

    if (resumeMode) {
      await resumeEngineer({
        email: form.email,
        password: form.password,
        portfolioFiles: form.portfolioFiles,
      });
      return;
    }

    if (role === "CLIENT") {
      await registerClient({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      return;
    }

    await registerEngineer({
      name: form.name,
      email: form.email,
      password: form.password,
      specialty: form.specialty,
      bio: form.bio,
      nationality: form.nationality,
      documentType: form.documentType,
      file: form.file!,
      portfolioFiles: form.portfolioFiles,
    });
  }

  function addPortfolioFiles(files: FileList | null) {
    if (!files?.length) return;
    setForm((prev) => ({
      ...prev,
      portfolioFiles: [...prev.portfolioFiles, ...Array.from(files)].slice(0, 10),
    }));
  }

  function removePortfolioFile(index: number) {
    setForm((prev) => ({
      ...prev,
      portfolioFiles: prev.portfolioFiles.filter((_, i) => i !== index),
    }));
  }

  return (
    <Card className="p-6 sm:p-8">
      <p className="text-xs uppercase tracking-wider text-electric-600 font-bold">
        {t("auth.step")} {displayStep} {t("auth.of")} {totalSteps}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{displayStepLabel}</h1>

      <div className="mt-3 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              i + 1 <= displayStep ? "bg-electric-500" : "bg-slate-200 dark:bg-slate-800",
            )}
          />
        ))}
      </div>

      {error && <p className="text-rose-500 text-sm mt-3">{error}</p>}
      {fieldErrors._form && (
        <p className="text-rose-500 text-sm mt-3">{fieldErrors._form}</p>
      )}

      <div className="mt-6">
        {step === 1 && (
          <div className="space-y-3">
            {[
              {
                role: "ENGINEER" as Role,
                title: t("auth.iEngShort"),
                desc: t("auth.iEngShortDesc"),
                icon: <IconBriefcase width={20} height={20} />,
              },
              {
                role: "CLIENT" as Role,
                title: t("auth.iClientShort"),
                desc: t("auth.iClientShortDesc"),
                icon: <IconUser width={20} height={20} />,
              },
            ].map((o) => (
              <button
                key={o.role}
                type="button"
                onClick={() => {
                  setRole(o.role);
                  setResumeMode(false);
                }}
                className={cn(
                  "w-full p-4 rounded-xl border text-start transition flex items-center gap-3 group",
                  role === o.role
                    ? "border-brand-copper bg-brand-copper/5"
                    : "border-slate-200 dark:border-slate-800 hover:border-brand-copper/60 hover:bg-brand-copper/5",
                )}
              >
                <span className="h-10 w-10 rounded-lg bg-brand-copper/10 text-brand-copper flex items-center justify-center group-hover:scale-110 transition">
                  {o.icon}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{o.title}</p>
                  <p className="text-xs text-slate-500">{o.desc}</p>
                </div>
                {role === o.role ? (
                  <IconCheck width={18} height={18} className="text-brand-copper" />
                ) : (
                  <IconArrow width={16} height={16} className="text-slate-400 rtl:rotate-180" />
                )}
              </button>
            ))}
          </div>
        )}

        {step === 2 && !resumeMode && (
          <div className="space-y-4">
            {role && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full !h-11"
                  onClick={handleGoogleSignIn}
                >
                  {t("auth.google")}
                </Button>
                <Divider label={t("common.or")} />
              </>
            )}

            <Field label={t("auth.fullName")} error={fieldErrors.name}>
              <Input
                icon={<IconUser width={16} height={16} />}
                type="text"
                placeholder={t("auth.namePh")}
                value={form.name}
                error={!!fieldErrors.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field label={t("auth.email")} error={fieldErrors.email}>
              <Input
                icon={<IconMail width={16} height={16} />}
                type="email"
                placeholder={t("auth.emailPh")}
                value={form.email}
                error={!!fieldErrors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={(e) => void inspectEmail(e.target.value)}
              />
            </Field>

            <Field label={t("auth.password")} error={fieldErrors.password}>
              <PasswordInput
                icon={<IconLock width={16} height={16} />}
                placeholder={t("auth.passMin")}
                value={form.password}
                error={!!fieldErrors.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setPassFocus(true)}
                onBlur={() => setPassFocus(false)}
              />
              {(passFocus || form.password.length > 0) ? (
                <PasswordChecklist password={form.password} />
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  {t("auth.passReq.helper")}
                </p>
              )}
            </Field>

            {role === "ENGINEER" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("auth.specialty")}
                  </label>
                  {fieldErrors.specialty && (
                    <p className="mt-1 text-xs text-rose-500">{fieldErrors.specialty}</p>
                  )}
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    {(["CIVIL", "ARCHITECTURAL"] as Specialty[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, specialty: s })}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-semibold text-center transition",
                          form.specialty === s
                            ? "border-electric-500 bg-electric-500/5 text-electric-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-electric-500/60",
                        )}
                      >
                        {s === "CIVIL" ? t("auth.civil") : t("auth.architectural")}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label={t("em.nationality")} error={fieldErrors.nationality}>
                  <select
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="mt-1.5 w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                  >
                    <option value="">{t("auth.nationalityPh")}</option>
                    {NATIONALITIES.map((nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </Field>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("auth.bio")}{" "}
                    <span className="text-slate-400 font-normal">({t("auth.optional")})</span>
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={t("auth.bioPh")}
                    value={form.bio}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && resumeMode && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">{t("auth.portfolioResumeHint")}</p>
            <Field label={t("auth.email")} error={fieldErrors.email}>
              <Input
                icon={<IconMail width={16} height={16} />}
                type="email"
                value={form.email}
                error={!!fieldErrors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={(e) => void inspectEmail(e.target.value)}
              />
            </Field>
            <Field label={t("auth.password")} error={fieldErrors.password}>
              <Input
                icon={<IconLock width={16} height={16} />}
                type="password"
                value={form.password}
                error={!!fieldErrors.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
            <PortfolioUploadSection
              t={t}
              files={form.portfolioFiles}
              required={portfolioRequired}
              error={fieldErrors.portfolioFiles}
              onAdd={addPortfolioFiles}
              onRemove={removePortfolioFile}
            />
          </div>
        )}

        {step === 3 && role === "ENGINEER" && !resumeMode && (
          <div className="space-y-4">
            {googleMode && (
              <p className="text-sm text-slate-500">{t("auth.googleDocsHint")}</p>
            )}
            <p className="text-sm text-slate-500">{t("auth.uploadDocHint")}</p>
            {googleMode && (!form.specialty || !form.nationality) && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("auth.specialty")}
                  </label>
                  {fieldErrors.specialty && (
                    <p className="mt-1 text-xs text-rose-500">{fieldErrors.specialty}</p>
                  )}
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    {(["CIVIL", "ARCHITECTURAL"] as Specialty[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, specialty: s })}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-semibold text-center transition",
                          form.specialty === s
                            ? "border-electric-500 bg-electric-500/5 text-electric-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-electric-500/60",
                        )}
                      >
                        {s === "CIVIL" ? t("auth.civil") : t("auth.architectural")}
                      </button>
                    ))}
                  </div>
                </div>

                <Field label={t("em.nationality")} error={fieldErrors.nationality}>
                  <select
                    value={form.nationality}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="mt-1.5 w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                  >
                    <option value="">{t("auth.nationalityPh")}</option>
                    {NATIONALITIES.map((nationality) => (
                      <option key={nationality} value={nationality}>
                        {nationality}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
            {(fieldErrors.documentType || fieldErrors.file) && (
              <p className="text-xs text-rose-500">
                {fieldErrors.documentType ?? fieldErrors.file}
              </p>
            )}
            <div className="space-y-3">
              {documentOptions.map((d) => (
                <label
                  key={d.type}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border border-dashed cursor-pointer transition",
                    form.documentType === d.type
                      ? "border-electric-500 bg-electric-500/5"
                      : "border-slate-300 dark:border-slate-700 hover:border-electric-500",
                  )}
                >
                  <span className="text-sm font-medium">{d.label}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setForm({
                          ...form,
                          documentType: d.type,
                          file: e.target.files[0],
                        });
                      }
                    }}
                  />
                  <span className="text-xs text-electric-600 font-semibold">
                    {form.documentType === d.type && form.file
                      ? form.file.name
                      : t("auth.upload")}
                  </span>
                </label>
              ))}
            </div>

            <PortfolioUploadSection
              t={t}
              files={form.portfolioFiles}
              required={portfolioRequired}
              error={fieldErrors.portfolioFiles}
              onAdd={addPortfolioFiles}
              onRemove={removePortfolioFile}
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1 || googleMode}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30"
        >
          {t("auth.back")}
        </button>

        {step < totalSteps && !googleMode ? (
          <Button onClick={goNext} icon={<IconArrow width={14} height={14} />}>
            {t("auth.continue")}
          </Button>
        ) : (
          <Button
            onClick={() => void handleDone()}
            disabled={
              loading ||
              (resumeMode && !portfolioReady) ||
              (step === 3 && role === "ENGINEER" && !portfolioReady)
            }
            icon={<IconCheck width={14} height={14} />}
          >
            {loading ? t("auth.creating") : t("auth.finishBtn")}
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-slate-500 mt-4">
        {t("auth.have")}{" "}
        <Link href="/login" className="text-electric-600 font-semibold hover:underline">
          {t("auth.signInLink")}
        </Link>
      </p>
    </Card>
  );
}

function PortfolioUploadSection({
  t,
  files,
  required,
  error,
  onAdd,
  onRemove,
}: {
  t: (key: string) => string;
  files: File[];
  required: number;
  error?: string;
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t("auth.portfolioTitle")}
          </p>
          <p className="text-xs text-slate-500">{t("auth.portfolioHint")}</p>
        </div>
        <span className="text-xs font-semibold text-electric-600">
          {files.length}/{required}
        </span>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
      <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-electric-500 transition">
        <span className="text-sm font-medium text-electric-600">{t("auth.portfolioAdd")}</span>
        <span className="text-xs text-slate-500">{t("auth.portfolioFormats")}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => onAdd(e.target.files)}
        />
      </label>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                className="text-xs font-semibold text-rose-500"
                onClick={() => onRemove(index)}
              >
                {t("common.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
