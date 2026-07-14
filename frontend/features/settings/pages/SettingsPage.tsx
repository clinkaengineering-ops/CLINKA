"use client";

import { useState } from "react";
import { IconUser, IconBell, IconLock, IconCard } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { SettingsSidebar, type SettingsTabId } from "../components/SettingsSidebar";
import { AccountSettingsTab } from "../components/AccountSettingsTab";
import { NotificationsSettingsTab } from "../components/NotificationsSettingsTab";
import { SecuritySettingsTab } from "../components/SecuritySettingsTab";
import { ProfessionalInfoTab } from "../components/ProfessionalInfoTab";

import { FeatureFlags } from "@/lib/features";
import useAuthStore from "@/store/authStore";

export function SettingsPage() {
  const { t } = useI18n();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<SettingsTabId>("account");

  const tabs: { id: SettingsTabId; label: string; icon: any }[] = [
    { id: "account", label: t("st.account"), icon: IconUser },
  ];

  if (user?.role === "ENGINEER" && FeatureFlags.ENABLE_PROFESSIONAL_PROFILES) {
    tabs.push(
      { id: "professional", label: "Professional Info", icon: IconCard }
    );
  }

  tabs.push(
    { id: "notif", label: t("st.notif"), icon: IconBell },
    { id: "security", label: t("st.security"), icon: IconLock },
  );

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
          {tab === "professional" && <ProfessionalInfoTab />}
          {tab === "notif" && <NotificationsSettingsTab />}
          {tab === "security" && <SecuritySettingsTab />}
        </div>
      </div>
    </div>
  );
}
