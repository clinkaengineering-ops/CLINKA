import { Avatar, Badge, Button, Card, StatCard } from "../components/UI";
import { AreaChart, BarChart, Donut } from "../components/Charts";
import { IconUsers, IconWallet, IconShield, IconAlert, IconCheck, IconClose, IconCircleDot, IconTrend } from "../components/Icons";
import { useI18n } from "../i18n";

export default function AdminDashboard() {
  const { t } = useI18n();

  const verifications = [
    { name: "Daniel Okafor", type: t("ep.v1"), when: "12m", priority: "High" },
    { name: "Sarah Mitchell", type: t("ep.v2"), when: "1h", priority: "Normal" },
    { name: "MendesCorp Ltd.", type: t("ep.v3"), when: "3h", priority: "Normal" },
    { name: "Yuki Tanaka", type: "Engineering License (P.E.)", when: "5h", priority: "High" },
  ];

  const disputes = [
    { case: "DSP-2849", parties: "Meridian × L. Hassan", amount: "$7,500", status: "Mediation", color: "amber", age: "2d" },
    { case: "DSP-2851", parties: "Aurora × S. Rinaldi", amount: "$3,400", status: "Awaiting evidence", color: "electric", age: "1d" },
    { case: "DSP-2856", parties: "NorthLogix × C. Mendes", amount: "$1,200", status: "Resolved", color: "green", age: "4h" },
    { case: "DSP-2861", parties: "St. Vincent × M. Chen", amount: "$10,800", status: "Escalated", color: "rose", age: "5d" },
  ];

  const systems = [
    { name: "API gateway", up: true, uptime: 99.99 },
    { name: "Escrow service", up: true, uptime: 99.97 },
    { name: "BIM file storage", up: true, uptime: 99.95 },
    { name: "Messaging realtime", up: true, uptime: 99.92 },
    { name: "Notification mailer", up: true, uptime: 99.88 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-slate-500 flex items-center gap-2"><IconShield width={14} height={14} className="text-electric-500" /> {t("ad.console")}</p>
          <h1 className="text-3xl font-bold tracking-tight">{t("ad.title")}</h1>
        </div>
        <div className="flex gap-2">
          <Badge color="green"><IconCircleDot width={10} height={10} /> {t("ad.allOps")}</Badge>
          <Button variant="secondary">{t("common.export")}</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("ad.totalUsers")} value="24,847" change="+412" icon={<IconUsers width={20} height={20} />} />
        <StatCard label={t("ad.gmv")} value="$8.42M" change="+22.4%" icon={<IconWallet width={20} height={20} />} />
        <StatCard label={t("ad.verifPending")} value="38" change="↓ from 52" icon={<IconShield width={20} height={20} />} />
        <StatCard label={t("ad.disputesOpen")} value="6" change="2 escalated" icon={<IconAlert width={20} height={20} />} accent="down" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-bold">{t("ad.revenue")}</h2>
              <p className="text-xs text-slate-500">{t("ad.feeSub")}</p>
            </div>
            <div className="flex gap-2">
              <Badge color="electric">{t("ad.fee8")}</Badge>
              <Badge color="violet">{t("ad.subscription")}</Badge>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-2xl font-bold">$673K</p><p className="text-xs text-slate-500">{t("ad.revYTD")}</p></div>
            <div><p className="text-2xl font-bold text-emerald-500">+34%</p><p className="text-xs text-slate-500">{t("ad.yoy")}</p></div>
            <div><p className="text-2xl font-bold">42.1%</p><p className="text-xs text-slate-500">{t("ad.netMargin")}</p></div>
          </div>
          <div className="mt-2 text-electric-500"><AreaChart data={[18, 24, 22, 31, 28, 36, 42, 38, 48, 56, 52, 67]} height={200} /></div>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold">{t("ad.escExposure")}</h2>
          <p className="text-xs text-slate-500">{t("ad.fundsHeld")}</p>
          <div className="mt-4 flex justify-center"><Donut value={72} label={t("ad.utilised")} /></div>
          <div className="mt-4 space-y-3 text-sm">
            <Row label={t("ad.totalEsc")} value="$2.84M" />
            <Row label={t("ad.released30")} value="$1.92M" emphasis="emerald" />
            <Row label={t("ad.refunded30")} value="$48,200" emphasis="rose" />
            <Row label={t("ad.disputed")} value="$112,000" emphasis="amber" />
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User growth bars */}
        <Card className="p-6">
          <h2 className="font-bold">{t("ad.userGrowth")}</h2>
          <p className="text-xs text-slate-500">{t("ad.newSignups")}</p>
          <div className="mt-4 text-electric-500"><BarChart data={[120, 180, 210, 290, 340, 412]} labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]} /></div>
        </Card>

        {/* Verification queue */}
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold">{t("ad.verifQueue")}</h2>
              <p className="text-xs text-slate-500">{t("ad.verifSla")}</p>
            </div>
            <Button size="sm" variant="ghost">{t("common.viewAll")}</Button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {verifications.map(v => (
              <div key={v.name} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <Avatar name={v.name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-slate-500">{v.type} · {v.when}</p>
                </div>
                <Badge color={v.priority === "High" ? "rose" : "electric"}>{v.priority}</Badge>
                <div className="flex gap-1">
                  <button className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center"><IconCheck width={14} height={14} /></button>
                  <button className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 flex items-center justify-center"><IconClose width={14} height={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Disputes & system health */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold">{t("ad.activeDisputes")}</h2>
            <Badge color="rose">{t("ad.openCount")}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                <tr><th className="text-start p-4">{t("ad.dCols.case")}</th><th className="text-start p-4">{t("ad.dCols.parties")}</th><th className="text-start p-4">{t("ad.dCols.amount")}</th><th className="text-start p-4">{t("ad.dCols.status")}</th><th className="text-start p-4">{t("ad.dCols.age")}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {disputes.map(d => (
                  <tr key={d.case} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4 font-mono text-xs">{d.case}</td>
                    <td className="p-4">{d.parties}</td>
                    <td className="p-4 font-bold">{d.amount}</td>
                    <td className="p-4"><Badge color={d.color as any}>{d.status}</Badge></td>
                    <td className="p-4 text-slate-500">{d.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-bold flex items-center gap-2"><IconTrend width={16} height={16} className="text-electric-500" /> {t("ad.sysHealth")}</h2>
          <div className="mt-4 space-y-3">
            {systems.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.up ? "bg-emerald-500" : "bg-rose-500"}`} />
                  <span>{s.name}</span>
                </div>
                <span className={s.up ? "text-emerald-500 font-medium" : "text-rose-500 font-medium"}>{s.up ? `${s.uptime}%` : "Down"}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <p>{t("ad.apiLat")} <span className="font-bold text-slate-900 dark:text-white">142ms</span></p>
            <p className="mt-1">{t("ad.bgJobs")} <span className="font-bold text-slate-900 dark:text-white">{t("ad.healthy")}</span></p>
          </div>
        </Card>
      </div>
    </div>
  );
}

const Row = ({ label, value, emphasis }: { label: string; value: string; emphasis?: "emerald" | "rose" | "amber" }) => {
  const c = emphasis === "emerald" ? "text-emerald-500" : emphasis === "rose" ? "text-rose-500" : emphasis === "amber" ? "text-amber-500" : "text-slate-900 dark:text-white";
  return (
    <div className="flex justify-between items-center text-sm"><span className="text-slate-500">{label}</span><span className={`font-bold ${c}`}>{value}</span></div>
  );
};
