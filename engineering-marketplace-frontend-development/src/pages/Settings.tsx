import { useState } from "react";
import { Avatar, Badge, Button, Card, Input } from "../components/UI";
import { IconUser, IconBell, IconLock, IconCard, IconCheck, IconUpload } from "../components/Icons";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

export default function Settings() {
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("st.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("st.subtitle")}</p>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <Card className="p-2 h-fit">
          {tabs.map(tt => {
            const Icon = tt.icon;
            return (
              <button
                key={tt.id}
                onClick={() => setTab(tt.id)}
                className={cn("w-full px-3 h-10 rounded-lg flex items-center gap-3 text-sm transition", tab === tt.id ? "bg-electric-500/10 text-electric-700 dark:text-electric-300 font-semibold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800")}
              >
                <Icon width={16} height={16} />{tt.label}
              </button>
            );
          })}
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
  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.profile")}</h2>
      <p className="text-sm text-slate-500">{t("st.profileSub")}</p>
      <div className="mt-5 flex items-center gap-4">
        <Avatar name="Layla Hassan" size={72} />
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" icon={<IconUpload width={14} height={14} />}>{t("st.uploadPhoto")}</Button>
          <Button size="sm" variant="ghost">{t("common.remove")}</Button>
        </div>
      </div>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label={t("st.fullName")}><Input defaultValue="Layla Hassan" /></Field>
        <Field label={t("st.fTitle")}><Input defaultValue="Senior Structural Engineer" /></Field>
        <Field label={t("st.email")}><Input defaultValue="layla@hassan-structural.com" /></Field>
        <Field label={t("st.phone")}><Input defaultValue="+20 100 555 1234" /></Field>
        <Field label={t("st.country")}><Input defaultValue="Egypt" /></Field>
        <Field label={t("st.tz")}><Input defaultValue="(GMT+2) Cairo" /></Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">{t("common.cancel")}</Button>
        <Button icon={<IconCheck width={14} height={14} />}>{t("common.saveChanges")}</Button>
      </div>
    </Card>
  );
}

function NotifTab() {
  const { t } = useI18n();
  const groups = [
    { name: t("st.gBidding"), items: ["New bid received", "Bid accepted", "Project milestone updated", "Contract signed"] },
    { name: t("st.gPay"), items: ["Funds escrowed", "Funds released", "Refund issued", "Receipt available"] },
    { name: t("st.gMsg"), items: ["New message", "Mentioned in a thread", "File shared with me"] },
    { name: t("st.gMkt"), items: ["Product updates", "Engineering blog newsletter"] },
  ];
  return (
    <Card className="p-6">
      <h2 className="font-bold">{t("st.notif")}</h2>
      <p className="text-sm text-slate-500">{t("st.notifSub")}</p>
      <div className="mt-5 space-y-6">
        {groups.map(g => (
          <div key={g.name}>
            <p className="text-sm font-semibold mb-2">{g.name}</p>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {g.items.map(it => (
                <div key={it} className="flex items-center justify-between p-3">
                  <p className="text-sm">{it}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <Toggle label={t("st.tEmail")} />
                    <Toggle label={t("st.tInApp")} defaultOn />
                    <Toggle label={t("st.tSms")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SecurityTab() {
  const { t } = useI18n();
  return (
    <>
      <Card className="p-6">
        <h2 className="font-bold">{t("st.password")}</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label={t("st.curPass")}><Input type="password" placeholder="••••••••" /></Field>
          <Field label={t("st.newPass")}><Input type="password" placeholder="••••••••" /></Field>
        </div>
        <div className="mt-4 flex justify-end"><Button>{t("st.updatePass")}</Button></div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-bold">{t("st.2fa")}</h2>
            <p className="text-sm text-slate-500">{t("st.2faSub")}</p>
          </div>
          <Badge color="green"><IconCheck width={10} height={10} /> {t("st.active")}</Badge>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold">{t("st.sessions")}</h2>
        <div className="mt-4 space-y-2">
          {[
            { device: "MacBook Pro · Chrome", loc: "Cairo, EG", time: "Active now", current: true },
            { device: "iPhone 16 · CLINKA app", loc: "Cairo, EG", time: "2h" },
            { device: "Windows · Edge", loc: "Riyadh, SA", time: "Yesterday" },
          ].map(s => (
            <div key={s.device} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium">{s.device}{s.current && <Badge color="green" className="ms-2">{t("st.current")}</Badge>}</p>
                <p className="text-xs text-slate-500">{s.loc} · {s.time}</p>
              </div>
              {!s.current && <Button size="sm" variant="ghost">{t("st.revoke")}</Button>}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function BillingTab() {
  const { t } = useI18n();
  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-navy-900 to-electric-700 text-white">
        <Badge className="!bg-white/10 !text-white !border-white/20">{t("st.curPlan")}</Badge>
        <h2 className="mt-3 text-2xl font-bold">{t("st.proPlan")}</h2>
        <p className="text-white/70 text-sm">{t("st.proPrice")}</p>
        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
          {[t("st.f1"), t("st.f2"), t("st.f3")].map(f => (
            <div key={f} className="flex items-center gap-2"><IconCheck width={14} height={14} className="text-electric-300" />{f}</div>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="!bg-white !text-navy-900">{t("st.managePlan")}</Button>
          <Button variant="ghost" className="!text-white hover:!bg-white/10">{t("st.viewInv")}</Button>
        </div>
      </Card>

      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold">{t("st.invoices")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
              <tr><th className="text-start p-4">{t("st.invoice")}</th><th className="text-start p-4">{t("st.date")}</th><th className="text-start p-4">{t("st.amount")}</th><th className="text-start p-4">{t("st.status")}</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$49.00", status: t("st.paid") },
                { id: "INV-2026-002", date: "Feb 1, 2026", amount: "$49.00", status: t("st.paid") },
                { id: "INV-2026-001", date: "Jan 1, 2026", amount: "$49.00", status: t("st.paid") },
              ].map(i => (
                <tr key={i.id}><td className="p-4 font-mono text-xs">{i.id}</td><td className="p-4">{i.date}</td><td className="p-4 font-bold">{i.amount}</td><td className="p-4"><Badge color="green">{i.status}</Badge></td><td className="p-4 text-end"><Button size="sm" variant="ghost">{t("st.download")}</Button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
    <div className="mt-1.5">{children}</div>
  </div>
);

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button onClick={() => setOn(!on)} className="flex items-center gap-1.5">
      <span className={cn("w-8 h-5 rounded-full transition relative", on ? "bg-electric-500" : "bg-slate-300 dark:bg-slate-700")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition shadow", on ? "start-3.5" : "start-0.5")} />
      </span>
      <span className="text-slate-500">{label}</span>
    </button>
  );
}
