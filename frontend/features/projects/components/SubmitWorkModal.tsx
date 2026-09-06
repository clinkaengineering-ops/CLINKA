"use client";

import { useState } from "react";
import { Button, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import { submitProjectWork } from "../api/project.api";

interface SubmitWorkModalProps {
  projectId: number;
  projectTitle: string;
  isRevision?: boolean;
  onClose: () => void;
  onSubmitted: () => void | Promise<void>;
}

export function SubmitWorkModal({
  projectId,
  projectTitle,
  isRevision,
  onClose,
  onSubmitted,
}: SubmitWorkModalProps) {
  const { t } = useI18n();
  const [notes, setNotes] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [links, setLinks] = useState<{ url: string; name?: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    setLinks((prev) => [...prev, { url, name: linkName.trim() || undefined }]);
    setLinkUrl("");
    setLinkName("");
  };

  const handleSubmit = async () => {
    // Grab any pending link the user typed but forgot to click 'Add' for
    const pendingUrl = linkUrl.trim();
    const pendingName = linkName.trim() || undefined;
    const finalLinks = [...links];
    if (pendingUrl) {
      finalLinks.push({ url: pendingUrl, name: pendingName });
    }

    if (!notes.trim() && finalLinks.length === 0 && files.length === 0) {
      setError(t("pay.submitWork.required"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitProjectWork(projectId, { notes: notes.trim() || undefined, links: finalLinks, files });

      await onSubmitted();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? t("pay.submitWork.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h3 className="font-bold text-lg">
            {isRevision ? t("pay.submitWork.resubmitTitle") : t("pay.submitWork.title")}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{projectTitle}</p>
        </div>

        <div className="p-5 overflow-y-auto">

        <label className="block mt-4 text-xs font-semibold uppercase text-slate-500">
          {t("pay.submitWork.notes")}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent p-3 text-sm"
          placeholder={t("pay.submitWork.notesPlaceholder")}
        />

        <label className="block mt-4 text-xs font-semibold uppercase text-slate-500">
          {t("pay.submitWork.files")}
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="mt-1 w-full text-sm"
        />

        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase text-slate-500">
            {t("pay.submitWork.links")}
          </label>
          <div className="mt-1 flex gap-2">
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            />
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder={t("pay.submitWork.linkName")}
              className="w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" variant="ghost" onClick={addLink}>
              {t("common.add")}
            </Button>
          </div>
          {links.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {links.map((l, i) => (
                <li key={`${l.url}-${i}`} className="truncate">
                  {l.name ? `${l.name}: ` : ""}
                  {l.url}
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}

        </div>

        <div className="p-5 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? t("common.loading") : t("pay.submitWork.submit")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
