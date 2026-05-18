"use client";
import { Avatar, Badge, Button, Card, Progress, StatCard } from "@/components/UI";
import { IconBriefcase, IconWallet, IconUsers, IconTrend, IconBell, IconArrow, IconMore } from "@/components/Icons";
import { useI18n } from "@/i18n";
import { useMe } from "@/features/users/hooks/useMe";

const mockProjects = [
  { title: "12-Story Mixed-Use Tower", cat: "Structural", engineer: "Layla Hassan", progress: 64, due: "Apr 12", escrow: "$22,500" },
  { title: "Hospital MEP BIM Coordination", cat: "MEP / BIM", engineer: "Marcus Chen", progress: 38, due: "May 30", escrow: "$32,000" },
  { title: "Boutique Hotel Concept", cat: "Architecture", engineer: "Sofia Rinaldi", progress: 92, due: "Mar 20", escrow: "$11,200" },
];

const mockNotifications = [
  { id: "n1", title: "New bid on 12-Story Tower", time: "5 min ago" },
  { id: "n2", title: "Milestone 2 funds released", time: "1 hour ago" },
  { id: "n3", title: "License verified", time: "Today" },
];

export function ClientDashboardPage() {
  const { t } = useI18n();
  const { user } = useMe();
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Welcome back,</p>
          <h1 className="text-3xl font-bold tracking-tight">{user?.name ?? "..."}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Invite</Button>
          <Button icon={<IconBriefcase width={16} height={16} />}>New Project</Button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Projects" value="6" change="2 this month" icon={<IconBriefcase width={20} height={20} />} />
        <StatCard label="In Escrow" value="$84,200" change="$12,500 pending" icon={<IconWallet width={20} height={20} />} />
        <StatCard label="Engineers Hired" value="11" change="3 new" icon={<IconUsers width={20} height={20} />} />
        <StatCard label="Avg Delivery" value="9 days" change="2 days faster" icon={<IconTrend width={20} height={20} />} />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">Active Projects</h2>
            <Button size="sm" variant="ghost" icon={<IconArrow width={14} height={14} />}>View all</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                <tr><th className="text-start p-4">Project</th><th className="text-start p-4">Engineer</th><th className="text-start p-4">Progress</th><th className="text-start p-4">Escrow</th><th className="p-4"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockProjects.map(p => (
                  <tr key={p.title} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4"><p className="font-semibold">{p.title}</p><p className="text-xs text-slate-500">{p.cat}</p></td>
                    <td className="p-4"><div className="flex items-center gap-2"><Avatar name={p.engineer} size={28} /><span className="text-xs">{p.engineer}</span></div></td>
                    <td className="p-4 min-w-40">
                      <div className="flex justify-between text-xs mb-1"><span>{p.progress}%</span><span className="text-slate-500">Due {p.due}</span></div>
                      <Progress value={p.progress} />
                    </td>
                    <td className="p-4 font-bold">{p.escrow}</td>
                    <td className="p-4 text-end"><button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><IconMore /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold flex items-center gap-2"><IconBell width={16} height={16} className="text-electric-500" /> Notifications</h2>
            <Badge color="electric">{mockNotifications.length}</Badge>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mockNotifications.map(n => (
              <div key={n.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
