"use client";

import Link from "next/link";
import { Badge, Card } from "@/components/UI";
import { useI18n } from "@/i18n";
import { useMyBids } from "../hooks/useMyBids";
import { formatMoney } from "@/features/escrow/utils/formatMoney";

const statusColor: Record<string, "amber" | "green" | "rose" | "slate"> = {
  PENDING: "amber",
  ACCEPTED: "green",
  REJECTED: "rose",
};

export function MyBidsPage() {
  const { t } = useI18n();
  const { bids, loading, error } = useMyBids();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("side.myBids")}</h1>
        <p className="mt-1 text-slate-500">{t("bids.subtitle")}</p>
      </div>

      {loading && <p className="text-sm text-slate-500">{t("common.loading")}</p>}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      {!loading && !error && bids.length === 0 && (
        <Card className="p-8 text-center text-slate-500">{t("bids.empty")}</Card>
      )}

      <div className="space-y-3">
        {bids.map((bid) => (
          <Card key={bid.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/projects?id=${bid.projectId}`}
                  className="font-semibold text-slate-900 dark:text-white hover:text-electric-600"
                >
                  {bid.project.title}
                </Link>
                <p className="text-sm text-slate-500 mt-1">
                  {formatMoney(bid.price)} · {bid.duration} · {bid.project.status}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                  {bid.description}
                </p>
              </div>
              <Badge color={statusColor[bid.status] ?? "slate"}>{bid.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
