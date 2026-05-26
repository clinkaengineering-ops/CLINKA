"use client";

import { useState } from "react";
import { Badge, Button, Card, Field, Input } from "@/components/UI";
import { IconCheck } from "@/components/Icons";
import { useI18n } from "@/i18n";
import {
  changePasswordFormSchema,
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { changePassword } from "../api/settings.api";

export function SecuritySettingsTab() {
  const { t } = useI18n();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handlePasswordUpdate() {
    const result = validateForm(changePasswordFormSchema, {
      oldPassword,
      newPassword,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setMessage(null);
    try {
      await changePassword(result.data);
      setMessage("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
    } catch (e: unknown) {
      const { message: msg, errors } = parseApiValidation(e);
      setFieldErrors(errors);
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="font-bold">{t("st.password")}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label={t("st.curPass")} error={fieldErrors.oldPassword}>
            <Input
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              error={!!fieldErrors.oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </Field>
          <Field label={t("st.newPass")} error={fieldErrors.newPassword}>
            <Input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              error={!!fieldErrors.newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
        </div>
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.includes("success") ? "text-emerald-600" : "text-rose-500"
            }`}
          >
            {message}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={handlePasswordUpdate} disabled={loading}>
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
