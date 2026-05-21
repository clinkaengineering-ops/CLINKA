"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Input } from "@/components/UI";
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

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
      {label}
    </label>
    <div className="mt-1.5">{children}</div>
  </div>
);

export function AccountSettingsTab() {
  const { t } = useI18n();
  const { me, loading, saving, error, save, refetch } = useAccountSettings();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [emailStep, setEmailStep] = useState<"idle" | "otp">("idle");
  const [otp, setOtp] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(me?.name ?? "");
    setBio(me?.profile?.bio ?? "");
    setEmail(me?.email ?? "");
  }, [me?.name, me?.profile?.bio, me?.email]);

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
    if (!email.trim() || email === me?.email) return;
    setEmailMsg(null);
    try {
      await requestEmailChange(email.trim());
      setEmailStep("otp");
      setEmailMsg("Verification code sent to your new email.");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setEmailMsg(err?.response?.data?.message ?? err?.message ?? "Failed");
    }
  }

  async function handleConfirmEmail() {
    setEmailMsg(null);
    try {
      await confirmEmailChange(otp);
      setEmailStep("idle");
      setOtp("");
      setEmailMsg("Email updated successfully.");
      await refetch();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setEmailMsg(err?.response?.data?.message ?? err?.message ?? "Invalid OTP");
    }
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
        <Field label={t("st.fullName")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("st.email")}>
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
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
              <Button size="sm" onClick={handleConfirmEmail}>
                Confirm
              </Button>
            </div>
          )}
          {emailMsg && <p className="mt-1 text-xs text-slate-500">{emailMsg}</p>}
        </Field>
        {me?.role === "ENGINEER" && (
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
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setName(me?.name ?? "");
            setBio(me?.profile?.bio ?? "");
            setEmail(me?.email ?? "");
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button
          disabled={saving}
          onClick={() => save({ name, bio: me?.role === "ENGINEER" ? bio : undefined })}
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

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file || !description.trim()) {
      setUploadError("Choose an image and enter a description.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadPortfolioItem(file, description.trim());
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
        <Field label={t("st.portfolioDesc")}>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label={t("st.portfolioImage")}>
          <input ref={fileRef} type="file" accept="image/*" className="text-sm w-full" />
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
