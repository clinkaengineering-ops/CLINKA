"use client";

import { useState } from "react";
import { IconUser, IconBell, IconLock, IconCard } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { SettingsSidebar, type SettingsTabId } from "../components/SettingsSidebar";
import { AccountSettingsTab } from "../components/AccountSettingsTab";
import { NotificationsSettingsTab } from "../components/NotificationsSettingsTab";
import { SecuritySettingsTab } from "../components/SecuritySettingsTab";
// import { BillingSettingsTab } from "../components/BillingSettingsTab";

export function SettingsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<SettingsTabId>("account");

  const tabs = [
    { id: "account" as const, label: t("st.account"), icon: IconUser },
    { id: "notif" as const, label: t("st.notif"), icon: IconBell },
    { id: "security" as const, label: t("st.security"), icon: IconLock },
    // { id: "billing" as const, label: t("st.billing"), icon: IconCard },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("st.title")}</h1>
        <p className="mt-1 text-slate-500">{t("st.subtitle")}</p>
      </div>
      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <SettingsSidebar tabs={tabs} active={tab} onChange={setTab} />
        <div className="space-y-6">
          {tab === "account" && <AccountSettingsTab />}
          {tab === "notif" && <NotificationsSettingsTab />}
          {tab === "security" && <SecuritySettingsTab />}
          {/* {tab === "billing" && <BillingSettingsTab />} */}
        </div>
      </div>
    </div>
  );
}
