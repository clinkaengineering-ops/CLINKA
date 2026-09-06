"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Field, Input } from "@/components/UI";
import {
  confirmEmailChangeFormSchema,
  portfolioItemFormSchema,
  requestEmailChangeFormSchema,
  updateProfileFormSchema,
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { IconCheck, IconUpload } from "@/components/Icons";
import { useI18n } from "@/i18n";
import {
  deletePortfolioItem,
  uploadAvatar,
  uploadCoverImage,
  uploadPortfolioItem,
} from "@/features/engineers/api/engineer.api";
import {
  confirmEmailChange,
  requestEmailChange,
} from "../api/settings.api";
import { useAccountSettings } from "../hooks/useAccountSettings";

export function AccountSettingsTab() {
  const { t } = useI18n();
  const { me, loading, saving, error, save, refetch } = useAccountSettings();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "otp">("idle");
  const [otp, setOtp] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(me?.name ?? "");
    setBio(me?.profile?.bio ?? "");
    setEmail(me?.email ?? "");
    setNationality(me?.profile?.nationality ?? "");
  }, [me?.name, me?.profile?.bio, me?.email, me?.profile?.nationality]);

  if (loading) {
    return <Card className="p-6 text-sm text-slate-500">{t("common.loading")}</Card>;
  }

  async function handleAvatar(file: File) {
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err?.response?.data?.message ?? err?.message ?? "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleCover(file: File) {
    try {
      await uploadCoverImage(file);
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      alert(err?.response?.data?.message ?? err?.message ?? "Upload failed");
    }
  }

  async function handleRequestEmailChange() {
    if (email === me?.email) {
      setEmailMsg("New email must be different from your current email.");
      return;
    }
    const result = validateForm(requestEmailChangeFormSchema, { newEmail: email });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setEmailMsg(null);
    try {
      await requestEmailChange(result.data.newEmail);
      setEmailStep("otp");
      setEmailMsg("Verification code sent to your new email.");
    } catch (e: unknown) {
      const { message, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setEmailMsg(message);
    }
  }

  async function handleConfirmEmail() {
    const result = validateForm(confirmEmailChangeFormSchema, { otp });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setEmailMsg(null);
    try {
      await confirmEmailChange(result.data.otp);
      setEmailStep("idle");
      setOtp("");
      setEmailMsg("Email updated successfully.");
      await refetch();
    } catch (e: unknown) {
      const { message, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setEmailMsg(message);
    }
  }

  async function handleSaveProfile() {
    if (me?.role === "ENGINEER" && !nationality) {
      setFieldErrors({ nationality: "Select your nationality" });
      return;
    }
    const result = validateForm(updateProfileFormSchema, {
      name,
      bio: me?.role === "ENGINEER" ? bio : undefined,
      nationality: me?.role === "ENGINEER" ? nationality : undefined,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    await save({
      name: result.data.name,
      bio: result.data.bio,
      nationality: result.data.nationality,
    });
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.profile")}</h2>
      <p className="text-sm text-slate-500">{t("st.profileSub")}</p>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

      <div className="mt-5 flex items-center gap-4">
        <Avatar
          name={me?.name ?? "User"}
          src={me?.avatarUrl ?? undefined}
          size={72}
        />
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleAvatar(f);
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<IconUpload width={14} height={14} />}
          disabled={avatarUploading}
          onClick={() => avatarRef.current?.click()}
        >
          {avatarUploading ? t("common.loading") : t("st.uploadPhoto")}
        </Button>
      </div>

      {me?.role === "ENGINEER" && (
        <div className="mt-4 flex items-center gap-4">
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCover(f);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            icon={<IconUpload width={14} height={14} />}
            onClick={() => coverRef.current?.click()}
          >
            Upload cover image
          </Button>
        </div>
      )}

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label={t("st.fullName")} error={fieldErrors.name}>
          <Input
            value={name}
            error={!!fieldErrors.name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t("st.email")} error={fieldErrors.newEmail}>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={emailStep === "otp"}
          />
          {email !== me?.email && emailStep === "idle" && (
            <Button size="sm" className="mt-2" onClick={handleRequestEmailChange}>
              Send verification code
            </Button>
          )}
          {emailStep === "otp" && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="6-digit code"
                value={otp}
                error={!!fieldErrors.otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
              />
              <Button size="sm" onClick={handleConfirmEmail}>
                Confirm
              </Button>
            </div>
          )}
          {fieldErrors.otp && (
            <p className="mt-1 text-xs text-rose-500">{fieldErrors.otp}</p>
          )}
          {emailMsg && (
            <p
              className={`mt-1 text-xs ${
                emailMsg.includes("success") ? "text-emerald-600" : "text-slate-500"
              }`}
            >
              {emailMsg}
            </p>
          )}
        </Field>
        {me?.role === "ENGINEER" && (
          <>
            <div className="sm:col-span-2">
              <Field label={t("em.nationality") || "Nationality"} error={fieldErrors.nationality}>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                >
                  <option value="">Select nationality...</option>
                  {[
                    "Afghan",
                    "Albanian",
                    "Algerian",
                    "Argentine",
                    "Armenian",
                    "Australian",
                    "Austrian",
                    "Azerbaijani",
                    "Bangladeshi",
                    "Belarusian",
                    "Belgian",
                    "Bolivian",
                    "Bosnian",
                    "Brazilian",
                    "British",
                    "Bulgarian",
                    "Cambodian",
                    "Cameroonian",
                    "Canadian",
                    "Chilean",
                    "Chinese",
                    "Colombian",
                    "Congolese",
                    "Croatian",
                    "Cuban",
                    "Czech",
                    "Danish",
                    "Dutch",
                    "Ecuadorian",
                    "Egyptian",
                    "Emirati",
                    "English",
                    "Estonian",
                    "Ethiopian",
                    "Finnish",
                    "French",
                    "Georgian",
                    "German",
                    "Ghanaian",
                    "Greek",
                    "Guatemalan",
                    "Hungarian",
                    "Indian",
                    "Indonesian",
                    "Iranian",
                    "Iraqi",
                    "Irish",
                    "Israeli",
                    "Italian",
                    "Jamaican",
                    "Japanese",
                    "Jordanian",
                    "Kazakh",
                    "Kenyan",
                    "Kuwaiti",
                    "Lebanese",
                    "Libyan",
                    "Lithuanian",
                    "Malaysian",
                    "Mexican",
                    "Mongolian",
                    "Moroccan",
                    "Nepalese",
                    "New Zealander",
                    "Nigerian",
                    "Norwegian",
                    "Omani",
                    "Pakistani",
                    "Palestinian",
                    "Peruvian",
                    "Philippine",
                    "Polish",
                    "Portuguese",
                    "Qatari",
                    "Romanian",
                    "Russian",
                    "Saudi",
                    "Scottish",
                    "Serbian",
                    "Singaporean",
                    "Slovak",
                    "Slovenian",
                    "Somali",
                    "South African",
                    "South Korean",
                    "Spanish",
                    "Sri Lankan",
                    "Sudanese",
                    "Swedish",
                    "Swiss",
                    "Syrian",
                    "Taiwanese",
                    "Tanzanian",
                    "Thai",
                    "Tunisian",
                    "Turkish",
                    "Ukrainian",
                    "Uruguayan",
                    "American",
                    "Uzbek",
                    "Venezuelan",
                    "Vietnamese",
                    "Yemeni",
                    "Zimbabwean",
                    "Other",
                  ].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Bio">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
                  placeholder="Tell others about yourself…"
                />
              </Field>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setName(me?.name ?? "");
            setBio(me?.profile?.bio ?? "");
            setEmail(me?.email ?? "");
            setNationality(me?.profile?.nationality ?? "");
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button
          disabled={saving}
          onClick={handleSaveProfile}
          icon={<IconCheck width={14} height={14} />}
        >
          {saving ? t("common.loading") : t("common.saveChanges")}
        </Button>
      </div>

      {me?.role === "ENGINEER" && (
        <EngineerPortfolioSection
          refetch={refetch}
          items={me.profile?.portfolio ?? []}
        />
      )}
    </Card>
  );
}

function EngineerPortfolioSection({
  items,
  refetch,
}: {
  items: { id: number; description: string }[];
  refetch: () => Promise<void>;
}) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    const result = validateForm(portfolioItemFormSchema, {
      description,
      file: file ?? new File([], ""),
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      setUploadError(result.errors.file ?? result.errors.description ?? null);
      return;
    }
    setFieldErrors({});
    setUploading(true);
    setUploadError(null);
    try {
      await uploadPortfolioItem(result.data.file, result.data.description);
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setUploadError(err?.response?.data?.message ?? err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <h3 className="font-bold">{t("st.portfolio")}</h3>
      <p className="text-sm text-slate-500 mt-1">{t("st.portfolioSub")}</p>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <Field label={t("st.portfolioDesc")} error={fieldErrors.description}>
          <Input
            value={description}
            error={!!fieldErrors.description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label={t("st.portfolioImage")}>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="text-sm w-full" />
        </Field>
      </div>
      {uploadError && <p className="mt-2 text-sm text-rose-500">{uploadError}</p>}
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          icon={<IconUpload width={14} height={14} />}
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? t("common.loading") : t("st.addPortfolio")}
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm"
            >
              <span className="truncate">{item.description}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await deletePortfolioItem(item.id);
                  await refetch();
                }}
              >
                {t("common.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
