"use client";
import { useState } from "react";
import { Avatar, Badge, Button, Card, Input } from "@/components/UI";
import { IconUser, IconBell, IconLock, IconCard, IconCheck, IconUpload } from "@/components/Icons";
import { cn } from "@/utils/cn";
import { useI18n } from "@/i18n";
import { useMe } from "@/features/auth/hooks/useMe";

export function SettingsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("account");
  const tabs = [
    { id: "account", label: t("st.account"), icon: IconUser },
    { id: "notif", label: t("st.notif"), icon: IconBell },
    { id: "security", label: t("st.security"), icon: IconLock },
    { id: "billing", label: t("st.billing"), icon: IconCard },
  ];
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("st.title")}</h1><p className="mt-1 text-slate-500">{t("st.subtitle")}</p></div>
      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <Card className="p-2 h-fit">
          {tabs.map(tt => { const Icon = tt.icon; return (<button key={tt.id} onClick={() => setTab(tt.id)} className={cn("w-full px-3 h-10 rounded-lg flex items-center gap-3 text-sm transition", tab === tt.id ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 font-semibold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}><Icon width={16} height={16} />{tt.label}</button>); })}
        </Card>
        <div className="space-y-6">
          {tab === "account" && <AccountTab />}
          {tab === "notif" && <NotifTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "billing" && <BillingTab />}
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const { t } = useI18n();
  const { me: user, update } = useMe();
  const [name, setName] = useState(user?.name ?? "");
  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.profile")}</h2>
      <p className="text-sm text-slate-500">{t("st.profileSub")}</p>
      <div className="mt-5 flex items-center gap-4"><Avatar name={user?.name ?? "User"} size={72} /><Button size="sm" variant="secondary" icon={<IconUpload width={14} height={14} />}>{t("st.uploadPhoto")}</Button></div>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label={t("st.fullName")}><Input value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label={t("st.email")}><Input defaultValue={user?.email ?? ""} disabled /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">{t("common.cancel")}</Button>
        <Button onClick={() => update({ name })} icon={<IconCheck width={14} height={14} />}>{t("common.saveChanges")}</Button>
      </div>
    </Card>
  );
}

function NotifTab() {
  const { t } = useI18n();
  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.notif")}</h2>
      <p className="text-sm text-slate-500 mt-1">{t("st.notifSub")}</p>
      <div className="mt-5 space-y-3">
        {["New bid received", "Bid accepted", "Funds released", "New message"].map(item => (
          <div key={item} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800"><p className="text-sm">{item}</p><Toggle defaultOn /></div>
        ))}
      </div>
    </Card>
  );
}

function SecurityTab() {
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
      const { authApi } = await import("@/features/auth/api/auth.api");
      await authApi.changePassword({ oldPassword, newPassword });
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
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </Field>
          <Field label={t("st.newPass")}>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
        </div>
        {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
        <div className="mt-4 flex justify-end">
          <Button onClick={handlePasswordUpdate} disabled={loading || !oldPassword || !newPassword}>
            {loading ? "Updating…" : t("st.updatePass")}
          </Button>
        </div>
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between"><div><h2 className="font-bold">{t("st.2fa")}</h2><p className="text-sm text-slate-500">{t("st.2faSub")}</p></div><Badge color="green"><IconCheck width={10} height={10} /> {t("st.active")}</Badge></div>
      </Card>
    </>
  );
}

function BillingTab() {
  const { t } = useI18n();
  return (
    <Card className="p-6 bg-gradient-to-br from-navy-900 to-electric-700 text-white">
      <Badge className="!bg-white/10 !text-white !border-white/20">{t("st.curPlan")}</Badge>
      <h2 className="mt-3 text-2xl font-bold">{t("st.proPlan")}</h2>
      <p className="text-white/70 text-sm">{t("st.proPrice")}</p>
      <div className="mt-5 flex gap-2"><Button variant="secondary" className="!bg-white !text-navy-900">{t("st.managePlan")}</Button></div>
    </Card>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label><div className="mt-1.5">{children}</div></div>
);

function Toggle({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button onClick={() => setOn(!on)} className={cn("w-10 h-6 rounded-full relative transition", on ? "bg-electric-500" : "bg-slate-300 dark:bg-slate-700")}>
      <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow transition", on ? "start-5" : "start-1")} />
    </button>
  );
}
