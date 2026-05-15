import { Avatar, Badge, Button, Card, Progress, StatCard } from "../components/UI";
import { IconWallet, IconCheck, IconClock, IconAlert, IconArrow, IconCard, IconArrowDown } from "../components/Icons";
import { useI18n } from "../i18n";

export default function Escrow() {
  const { t } = useI18n();

  const milestones = [
    { title: "Milestone 1 — Concept Layout", desc: "General arrangement, gravity load take-down.", amount: "$3,000", status: "Released", statusKey: t("es.s.released"), due: "Mar 4" },
    { title: "Milestone 2 — Schematic Design", desc: "Preliminary sizing, foundation concept.", amount: "$4,500", status: "In Escrow", statusKey: t("es.s.inEscrow"), due: "Mar 18" },
    { title: "Milestone 3 — Detailed Design", desc: "Full ETABS model, member sizing, drawings.", amount: "$6,000", status: "Pending", statusKey: t("es.s.pending"), due: `${t("common.due")} Apr 2` },
    { title: "Milestone 4 — Coordination", desc: "Clash review with arch and MEP.", amount: "$3,000", status: "Upcoming", statusKey: t("es.s.upcoming"), due: `${t("common.due")} Apr 18` },
    { title: "Milestone 5 — IFC Drawings", desc: "Issued for construction set & detailing.", amount: "$4,000", status: "Upcoming", statusKey: t("es.s.upcoming"), due: `${t("common.due")} May 2` },
    { title: "Milestone 6 — Site Support", desc: "RFIs and shop drawing reviews.", amount: "$2,000", status: "Upcoming", statusKey: t("es.s.upcoming"), due: `${t("common.due")} May 30` },
  ];

  const tx = [
    { id: 1, date: "Mar 18, 2026", desc: "Milestone 2 funded — 12-Story Tower", ref: "TXN-44829", type: "Escrow Hold", color: "electric", amount: "-$4,500.00", status: "Cleared" },
    { id: 2, date: "Mar 12, 2026", desc: "Milestone 1 released to L. Hassan", ref: "TXN-44712", type: "Release", color: "green", amount: "-$3,000.00", status: "Sent" },
    { id: 3, date: "Mar 10, 2026", desc: "Hospital MEP — bid acceptance", ref: "TXN-44698", type: "Escrow Hold", color: "electric", amount: "-$10,800.00", status: "Cleared" },
    { id: 4, date: "Mar 04, 2026", desc: "Boutique Hotel — Final payment", ref: "TXN-44552", type: "Release", color: "green", amount: "-$2,400.00", status: "Sent" },
    { id: 5, date: "Feb 28, 2026", desc: "Refund — Warehouse scope reduced", ref: "TXN-44488", type: "Refund", color: "amber", amount: "+$1,200.00", status: "Refunded" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("es.title")}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">{t("es.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("es.statIn")} value="$84,200" icon={<IconWallet width={20} height={20} />} change="3 contracts" />
        <StatCard label={t("es.statReleased")} value="$42,800" icon={<IconCheck width={20} height={20} />} change="+12%" />
        <StatCard label={t("es.statPending")} value="$10,800" icon={<IconClock width={20} height={20} />} change="approval" />
        <StatCard label={t("es.statRefund")} value="0" icon={<IconAlert width={20} height={20} />} change="all clear" />
      </div>

      {/* Active contract milestones */}
      <Card>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold">{t("es.contractTitle")}</h2>
            <p className="text-xs text-slate-500">{t("es.contractMeta")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name="Layla Hassan" size={32} />
            <Button size="sm" variant="secondary">{t("es.openContract")}</Button>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold">{t("es.overallProgress")}</span>
            <span className="text-slate-500">{t("es.msComplete")}</span>
          </div>
          <Progress value={33} />

          {/* Milestone timeline */}
          <div className="mt-8 space-y-3">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center font-bold text-xs ${
                    m.status === "Released" ? "bg-emerald-500 border-emerald-500 text-white" :
                    m.status === "In Escrow" ? "bg-electric-500 border-electric-500 text-white" :
                    m.status === "Pending" ? "border-amber-500 text-amber-500" :
                    "border-slate-300 text-slate-400 dark:border-slate-700"
                  }`}>
                    {m.status === "Released" ? <IconCheck width={16} height={16} /> : i + 1}
                  </div>
                  {i < milestones.length - 1 && <div className={`flex-1 w-0.5 mt-1 ${m.status === "Released" ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />}
                </div>
                <div className="flex-1 pb-6">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-electric-500/40 transition">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{m.title}</p>
                          <Badge color={m.status === "Released" ? "green" : m.status === "In Escrow" ? "electric" : m.status === "Pending" ? "amber" : "slate"}>{m.statusKey}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
                      </div>
                      <p className="text-lg font-bold text-electric-600 dark:text-electric-400">{m.amount}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1"><IconClock width={12} height={12} />{m.due}</span>
                      <div className="flex gap-2">
                        {m.status === "In Escrow" && <Button size="sm" icon={<IconCheck width={12} height={12} />}>{t("common.release")}</Button>}
                        {m.status === "In Escrow" && <Button size="sm" variant="ghost">{t("common.refundReq")}</Button>}
                        {m.status === "Pending" && <Button size="sm" variant="secondary">{t("common.fund")}</Button>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Transaction history + Methods */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold">{t("es.txHistory")}</h2>
            <Button size="sm" variant="ghost" icon={<IconArrowDown width={14} height={14} />}>{t("common.exportCsv")}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  <th className="text-start p-4">{t("es.cols.date")}</th>
                  <th className="text-start p-4">{t("es.cols.desc")}</th>
                  <th className="text-start p-4">{t("es.cols.type")}</th>
                  <th className="text-end p-4">{t("es.cols.amount")}</th>
                  <th className="text-start p-4">{t("es.cols.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tx.map(tt => (
                  <tr key={tt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4 text-slate-500 whitespace-nowrap">{tt.date}</td>
                    <td className="p-4">
                      <p className="font-medium">{tt.desc}</p>
                      <p className="text-xs text-slate-500">{tt.ref}</p>
                    </td>
                    <td className="p-4"><Badge color={tt.color as any}>{tt.type}</Badge></td>
                    <td className={`p-4 text-end font-bold ${tt.amount.startsWith("-") ? "text-rose-500" : "text-emerald-500"}`}>{tt.amount}</td>
                    <td className="p-4"><span className="text-xs text-slate-500">{tt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{t("es.payMethods")}</h3>
              <Button size="sm" variant="ghost">+ {t("common.add")}</Button>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { brand: "VISA", last: "4242", default: true },
                { brand: "MASTERCARD", last: "8829", default: false },
              ].map(c => (
                <div key={c.last} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="h-9 w-12 rounded-md bg-gradient-to-br from-navy-800 to-navy-900 text-white text-[10px] font-bold flex items-center justify-center">{c.brand}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">•••• {c.last}</p>
                    <p className="text-xs text-slate-500">{t("es.expires")} 11/28</p>
                  </div>
                  {c.default && <Badge color="electric">{t("es.default")}</Badge>}
                </div>
              ))}
              <button className="w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-500 hover:border-electric-500 hover:text-electric-500 transition flex items-center justify-center gap-2">
                <IconCard width={14} height={14} /> {t("es.addBank")}
              </button>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-navy-900 to-electric-700 text-white">
            <p className="text-sm font-bold">{t("es.helpTitle")}</p>
            <p className="mt-1 text-xs text-white/70">{t("es.helpDesc")}</p>
            <Button size="sm" variant="secondary" className="mt-4 !bg-white !text-navy-900" icon={<IconArrow width={12} height={12} />}>{t("es.contact")}</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
