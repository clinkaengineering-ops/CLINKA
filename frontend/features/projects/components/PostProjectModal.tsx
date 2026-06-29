"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input, Textarea } from "@/components/UI";
import { IconCheck, IconClose } from "@/components/Icons";
import {
  createProjectFormSchema,
  parseApiValidation,
  validateForm,
  type FieldErrors,
} from "@/lib/validation";
import { useCreateProject } from "../hooks/useProjects";
import type { ServiceType } from "../api/project.api";
import { useI18n } from "@/i18n";

interface PostProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  initialTitle?: string;
  initialDescription?: string;
  initialBudget?: string;
  initialServiceType?: ServiceType;
}

export function PostProjectModal({
  open,
  onClose,
  onCreated,
  initialTitle,
  initialDescription,
  initialBudget,
  initialServiceType,
}: PostProjectModalProps) {
  const { t } = useI18n();
  const serviceTypes: { value: ServiceType; labelKey: string }[] = [
    { value: "DESIGN", labelKey: "service.design" },
    { value: "SUPERVISION", labelKey: "service.supervision" },
    { value: "REVIEW", labelKey: "service.review" },
  ];
  const { create, loading, error: apiError } = useCreateProject(() => {
    onCreated?.();
    onClose();
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    serviceType: "DESIGN" as ServiceType,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      title: initialTitle ?? prev.title,
      description: initialDescription ?? prev.description,
      budget: initialBudget ?? prev.budget,
      serviceType: initialServiceType ?? prev.serviceType,
    }));
  }, [
    open,
    initialTitle,
    initialDescription,
    initialBudget,
    initialServiceType,
  ]);

  if (!open) return null;

  async function handleSubmit() {
    const result = validateForm(createProjectFormSchema, {
      title: form.title,
      description: form.description,
      budget: form.budget,
      serviceType: form.serviceType,
    });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    try {
      await create(result.data);
      setForm({ title: "", description: "", budget: "", serviceType: "DESIGN" });
    } catch (e) {
      const { errors } = parseApiValidation(e);
      setFieldErrors(errors);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("pm.postModal.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t("common.close")}
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        {apiError && <p className="text-sm text-rose-500">{apiError}</p>}
        {fieldErrors._form && (
          <p className="text-sm text-rose-500">{fieldErrors._form}</p>
        )}

        <Field label={t("pm.postModal.titleLabel")} error={fieldErrors.title}>
          <Input
            value={form.title}
            error={!!fieldErrors.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("pm.postModal.titlePh")}
          />
        </Field>

        <Field label={t("common.description")} error={fieldErrors.description}>
          <Textarea
            rows={4}
            value={form.description}
            error={!!fieldErrors.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t("pm.postModal.descPh")}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t("pm.postModal.budgetLabel")} error={fieldErrors.budget}>
            <Input
              type="number"
              min={1}
              value={form.budget}
              error={!!fieldErrors.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="25000"
            />
          </Field>
          <Field label={t("pm.postModal.serviceType")} error={fieldErrors.serviceType}>
            <select
              value={form.serviceType}
              onChange={(e) =>
                setForm({ ...form, serviceType: e.target.value as ServiceType })
              }
              className={`w-full h-10 rounded-lg border bg-white dark:bg-slate-900 px-3 text-sm ${
                fieldErrors.serviceType
                  ? "border-rose-500"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {serviceTypes.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            icon={<IconCheck width={14} height={14} />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t("pm.postModal.posting") : t("pm.postModal.submit")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
