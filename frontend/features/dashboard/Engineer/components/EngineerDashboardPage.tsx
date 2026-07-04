"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, StatCard } from "@/components/UI";
import { IconBriefcase, IconMessage } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useMe } from "@/features/auth/hooks/useMe";
import { useMyBids } from "@/features/bids/hooks/useMyBids";
import { fetchConversations } from "@/features/messages/api/messages.api";
import { useEffect, useState } from "react";
import { fetchEngineerBalance } from "@/features/escrow/api/payments.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import { EngineerDashboardAnalytics } from "./EngineerDashboardAnalytics";
import type { EngineerBalanceSummary } from "@/features/escrow/types";

export function EngineerDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { me, loading } = useMe();
  const { activeContracts, bids } = useMyBids();
  const [inboxCount, setInboxCount] = useState(0);
  const [balance, setBalance] = useState<EngineerBalanceSummary | null>(null);

  useEffect(() => {
    fetchConversations()
      .then((c) => setInboxCount(c.length))
      .catch(() => setInboxCount(0));
    fetchEngineerBalance()
      .then((b) => setBalance(b))
      .catch(() => setBalance(null));
  }, []);

  const verification = me?.profile?.verificationStatus ?? "PENDING";
  const activeCount = activeContracts.length;
  const pendingBids = bids.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {t("ed.welcomeNamed").replace("{name}", me?.name?.split(" ")[0] ?? "…")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{t("ed.title")}</h1>
        </div>
        <Button
          icon={<IconBriefcase width={16} height={16} />}
          onClick={() => router.push("/projects")}
        >
          {t("ed.findProj")}
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t("bal.available")}
          value={formatMoney(balance?.availableBalance ?? 0)}
          change={`${formatMoney(balance?.securedBalance ?? 0)} secured`}
          accent="up"
          icon={<IconBriefcase width={20} height={20} />}
        />
        <StatCard
          label={t("ed.activeContracts")}
          value={String(activeCount)}
          change={`${bids.length} total bids`}
          accent="up"
          icon={<IconBriefcase width={20} height={20} />}
        />
        <StatCard
          label={t("side.myBids")}
          value={String(pendingBids)}
          change="Awaiting client"
          accent="up"
          icon={<IconBriefcase width={20} height={20} />}
        />
        <StatCard
          label={t("side.messages")}
          value={String(inboxCount)}
          change="Conversations"
          accent="up"
          icon={<IconMessage width={20} height={20} />}
        />
      </div>

      <EngineerDashboardAnalytics bids={bids} />

      <Card className="p-6">
        <h2 className="font-bold">{t("ed.quickLinks")}</h2>
        <p className="text-sm text-slate-500 mt-2">{t("ed.completeMsg")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/projects">
            <Button variant="secondary">{t("side.findProjects")}</Button>
          </Link>
          <Link href="/my-bids">
            <Button variant="secondary">{t("side.myBids")}</Button>
          </Link>
          <Link href="/messages">
            <Button variant="secondary">{t("side.messages")}</Button>
          </Link>
          <Link href="/balance">
            <Button variant="secondary">{t("side.balance")}</Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost">{t("side.settings")}</Button>
          </Link>
        </div>
        {verification !== "APPROVED" && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            {t("vf.reviewing")}
          </p>
        )}
      </Card>

      {loading && (
        <p className="text-sm text-slate-500">{t("common.loading")}</p>
      )}
    </div>
  );
}
