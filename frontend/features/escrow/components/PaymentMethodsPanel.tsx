"use client";

import { Badge, Card } from "@/components/UI";
import { IconCard } from "@/components/Icons";
import { useI18n } from "@/i18n";
import type { FawaterkPaymentMethod } from "../types";

export function PaymentMethodsPanel({
  methods,
  loading,
  error,
  onSelectMethod,
  selectedMethodId,
}: {
  methods: FawaterkPaymentMethod[];
  loading: boolean;
  error: string | null;
  onSelectMethod?: (id: number) => void;
  selectedMethodId?: number | null;
}) {
  const { t, lang } = useI18n();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{t("es.payMethods")}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {loading && (
          <p className="text-sm text-slate-500">{t("common.loading")}</p>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
        {!loading &&
          !error &&
          methods.map((m) => (
            <button
              key={m.paymentId}
              type="button"
              onClick={() => onSelectMethod?.(m.paymentId)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-start transition ${
                selectedMethodId === m.paymentId
                  ? "border-electric-500 bg-electric-500/5"
                  : "border-slate-200 dark:border-slate-800 hover:border-electric-500/40"
              }`}
            >
              <div className="h-9 w-12 rounded-md bg-gradient-to-br from-navy-800 to-navy-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                <IconCard width={14} height={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {lang === "ar" ? m.name_ar : m.name_en}
                </p>
                <p className="text-xs text-slate-500">ID {m.paymentId}</p>
              </div>
              {selectedMethodId === m.paymentId && (
                <Badge color="electric">{t("es.default")}</Badge>
              )}
            </button>
          ))}
        {!loading && !error && methods.length === 0 && (
          <p className="text-sm text-slate-500">{t("es.noMethods")}</p>
        )}
      </div>
    </Card>
  );
}
