"use client";

import { useState } from "react";
import { Badge, Button, Card, Input } from "@/components/UI";
import { IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { changePassword } from "../api/settings.api";

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

export function SecuritySettingsTab() {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordUpdate() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await changePassword({ oldPassword, newPassword });
      setMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="font-bold">{t("st.password")}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label={t("st.curPass")}>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </Field>
          <Field label={t("st.newPass")}>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
        </div>
        {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handlePasswordUpdate}
            disabled={loading || !oldPassword || !newPassword}
          >
            {loading ? "Updating…" : t("st.updatePass")}
          </Button>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">{t("st.2fa")}</h2>
            <p className="text-sm text-slate-500">{t("st.2faSub")}</p>
          </div>
          <Badge color="green">
            <IconCheck width={10} height={10} /> {t("st.active")}
          </Badge>
        </div>
      </Card>
    </>
  );
}
