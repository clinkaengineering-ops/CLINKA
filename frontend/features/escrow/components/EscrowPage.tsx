"use client";
import { Badge, Button, Card, StatCard } from "@/components/UI";
import { IconWallet, IconCheck, IconArrow } from "@/components/Icons";
import { useI18n } from "@/i18n";

const mockEscrow = [
  { id: "e1", label: "Milestone 2 — Schematic Design", project: "12-Story Tower", status: "PENDING", amount: "$7,500", due: "3d" },
  { id: "e2", label: "Milestone 1 — Concept", project: "Boutique Hotel", status: "RELEASED", amount: "$3,400", due: "Done" },
  { id: "e3", label: "Milestone 3 — Coordination", project: "Hospital MEP", status: "PENDING", amount: "$10,800", due: "12d" },
];

export function EscrowPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-3xl font-bold tracking-tight">{t("esc.title")}</h1><p className="mt-1 text-slate-500">{t("esc.subtitle")}</p></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total in Escrow" value="$84,200" icon={<IconWallet width={20} height={20} />} />
        <StatCard label="Pending Release" value="$18,300" icon={<IconWallet width={20} height={20} />} />
        <StatCard label="Released This Month" value="$24,600" change="+12%" icon={<IconWallet width={20} height={20} />} />
      </div>
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold">{t("esc.milestones")}</h2>
          <Button size="sm" variant="secondary">Manage Payments</Button>
        </div>
        <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockEscrow.map(e => (
            <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-electric-500/40 transition">
              <div className="flex items-center justify-between">
                <Badge color={e.status === "RELEASED" ? "green" : "amber"}>{e.status}</Badge>
                <p className="text-xs text-slate-500">{e.due}</p>
              </div>
              <p className="mt-3 font-semibold text-sm">{e.label}</p>
              <p className="text-xs text-slate-500">{e.project}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xl font-bold">{e.amount}</p>
                {e.status === "PENDING" ? <Button size="sm" icon={<IconCheck width={14} height={14} />}>Release</Button> : <Button size="sm" variant="ghost" icon={<IconArrow width={14} height={14} />}>Details</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
