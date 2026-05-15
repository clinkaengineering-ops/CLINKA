import { Avatar, Badge, Button, Card, Progress, StatCard } from "../components/UI";
import { AreaChart } from "../components/Charts";
import { IconBriefcase, IconWallet, IconUsers, IconTrend, IconBell, IconArrow, IconCheck, IconClock, IconMore } from "../components/Icons";
import { messages, notifications } from "../lib/data";
import { useI18n } from "../i18n";

export default function ClientDashboard() {
  const { t } = useI18n();

  const clientProjects = [
    { title: "12-Story Mixed-Use Tower", cat: t("disc.structural"), engineer: "Layla Hassan", progress: 64, due: `${t("common.due")} Apr 12`, escrow: "$22,500" },
    { title: "Hospital MEP BIM Coordination", cat: t("disc.mepBim"), engineer: "Marcus Chen", progress: 38, due: `${t("common.due")} May 30`, escrow: "$32,000" },
    { title: "Boutique Hotel Concept", cat: t("disc.architecture"), engineer: "Sofia Rinaldi", progress: 92, due: `${t("common.due")} Mar 20`, escrow: "$11,200" },
    { title: "Highway Bridge Geotech", cat: t("disc.geotech"), engineer: "Elena Volkov", progress: 12, due: `${t("common.due")} Jun 15`, escrow: "$26,500" },
  ];

  const escrowItems = [
    { label: "Milestone 2 — Schematic Design", project: "12-Story Tower", status: "In escrow", statusKey: t("cd.inEscrowS"), amount: "$7,500", due: "3d" },
    { label: "Milestone 1 — Concept", project: "Boutique Hotel", status: "Released", statusKey: t("cd.released"), amount: "$3,400", due: "Done" },
    { label: "Milestone 3 — Coordination", project: "Hospital MEP", status: "Pending", statusKey: t("cd.pending"), amount: "$10,800", due: "12d" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{t("cd.welcome")}</p>
          <h1 className="text-3xl font-bold tracking-tight">{t("cd.title")}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">{t("common.invite")}</Button>
          <Button icon={<IconBriefcase width={16} height={16} />}>{t("cd.newProject")}</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("cd.activeProjects")} value="6" change="2 this month" icon={<IconBriefcase width={20} height={20} />} />
        <StatCard label={t("cd.inEscrow")} value="$84,200" change="$12,500 pending" icon={<IconWallet width={20} height={20} />} />
        <StatCard label={t("cd.engineersHired")} value="11" change="3 new" icon={<IconUsers width={20} height={20} />} />
        <StatCard label={t("cd.avgDelivery")} value="9 days" change="2 days faster" icon={<IconTrend width={20} height={20} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spend chart */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">{t("cd.spendOverview")}</h2>
              <p className="text-xs text-slate-500">{t("cd.spendDesc")}</p>
            </div>
            <div className="flex gap-1 text-xs">
              {["1M", "6M", "12M", "All"].map(p => (
                <button key={p} className={`h-7 px-3 rounded-md ${p === "12M" ? "bg-electric-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold">$268,400 <span className="text-sm font-medium text-emerald-500">+18.4%</span></div>
          <div className="mt-4 text-electric-500">
            <AreaChart data={[12, 18, 16, 24, 22, 30, 28, 35, 32, 42, 38, 48]} />
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold flex items-center gap-2"><IconBell width={16} height={16} className="text-electric-500" /> {t("cd.notif")}</h2>
            <Badge color="electric">{notifications.length}</Badge>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map(n => (
              <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition cursor-pointer">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active projects */}
        <Card className="lg:col-span-2">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">{t("cd.activeProjectsT")}</h2>
            <Button size="sm" variant="ghost" icon={<IconArrow width={14} height={14} />}>{t("common.viewAll")}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  <th className="text-start p-4">{t("cd.cols.project")}</th>
                  <th className="text-start p-4">{t("cd.cols.engineer")}</th>
                  <th className="text-start p-4">{t("cd.cols.progress")}</th>
                  <th className="text-start p-4">{t("cd.cols.escrow")}</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clientProjects.map(p => (
                  <tr key={p.title} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4">
                      <p className="font-semibold">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.cat}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.engineer} size={28} />
                        <span className="text-xs">{p.engineer}</span>
                      </div>
                    </td>
                    <td className="p-4 min-w-40">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium">{p.progress}%</span>
                        <span className="text-slate-500">{p.due}</span>
                      </div>
                      <Progress value={p.progress} />
                    </td>
                    <td className="p-4 text-sm font-bold">{p.escrow}</td>
                    <td className="p-4 text-end"><button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><IconMore /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Messages */}
        <Card>
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">{t("cd.messages")}</h2>
            <Badge color="electric">{t("cd.newMsgs")}</Badge>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.slice(0, 4).map(m => (
              <div key={m.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <div className="relative">
                  <Avatar name={m.name} size={36} />
                  {m.online && <span className="absolute bottom-0 end-0 h-2.5 w-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-sm font-semibold truncate">{m.name}</p>
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{m.preview}</p>
                </div>
                {m.unread > 0 && <Badge color="electric">{m.unread}</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Escrow tracking */}
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold">{t("cd.escrowTracking")}</h2>
            <p className="text-xs text-slate-500">{t("cd.escrowDesc")}</p>
          </div>
          <Button size="sm" variant="secondary">{t("cd.managePay")}</Button>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {escrowItems.map(e => (
            <div key={e.label} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-electric-500/40 transition">
              <div className="flex items-center justify-between">
                <Badge color={e.status === "Released" ? "green" : e.status === "Pending" ? "amber" : "electric"}>{e.statusKey}</Badge>
                <p className="text-xs text-slate-500 flex items-center gap-1"><IconClock width={12} height={12} />{e.due}</p>
              </div>
              <p className="mt-3 font-semibold text-sm">{e.label}</p>
              <p className="text-xs text-slate-500">{e.project}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xl font-bold">{e.amount}</p>
                {e.status === "In escrow" ? (
                  <Button size="sm" icon={<IconCheck width={14} height={14} />}>{t("common.release")}</Button>
                ) : (
                  <Button size="sm" variant="ghost">{t("common.details")}</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
