"use client";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconUsers, IconWallet, IconShield, IconAlert, IconCheck, IconClose } from "@/components/Icons";
import { useI18n } from "@/i18n";

const mockVerifications = [
  { id: 1, name: "Daniel Okafor", type: "College ID", when: "12m", priority: "High" },
  { id: 2, name: "Sarah Mitchell", type: "Engineering Certificate", when: "1h", priority: "Normal" },
  { id: 3, name: "Yuki Tanaka", type: "Syndicate Card", when: "5h", priority: "High" },
];

export function AdminPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-slate-500 flex items-center gap-2"><IconShield width={14} height={14} className="text-electric-500" /> Admin Console</p>
          <h1 className="text-3xl font-bold tracking-tight">{t("ad.title")}</h1>
        </div>
        <Button variant="secondary">Export</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("ad.totalUsers")} value="24,847" change="+412" icon={<IconUsers width={20} height={20} />} />
        <StatCard label={t("ad.gmv")} value="$8.42M" change="+22.4%" icon={<IconWallet width={20} height={20} />} />
        <StatCard label={t("ad.verifPending")} value="38" change="↓ from 52" icon={<IconShield width={20} height={20} />} />
        <StatCard label={t("ad.disputesOpen")} value="6" change="2 escalated" icon={<IconAlert width={20} height={20} />} accent="down" />
      </div>
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold">Pending Verifications</h2>
          <Badge color="amber">{mockVerifications.length} pending</Badge>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {mockVerifications.map(v => (
            <div key={v.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-sm">{v.name}</p>
                <p className="text-xs text-slate-500">{v.type} · {v.when} ago</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={v.priority === "High" ? "rose" : "slate"}>{v.priority}</Badge>
                <Button size="sm" icon={<IconCheck width={14} height={14} />}>Approve</Button>
                <Button size="sm" variant="danger" icon={<IconClose width={14} height={14} />}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
