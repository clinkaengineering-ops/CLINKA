import { Badge, Button, Card, Progress, StatCard } from "../components/UI";
import { AreaChart, BarChart, Donut } from "../components/Charts";
import { IconWallet, IconBriefcase, IconStar, IconTrend, IconFile, IconUpload, IconArrow, IconBolt } from "../components/Icons";
import { useI18n } from "../i18n";

export default function EngineerDashboard() {
  const { t } = useI18n();

  const bids = [
    { title: "12-Story Mixed-Use Tower", bid: "$22,500", when: `2h ${t("common.now") === "now" ? "ago" : t("common.now")}`, status: "Shortlisted", color: "amber" },
    { title: "Hospital MEP Coordination", bid: "$30,200", when: "1d", status: "Submitted", color: "electric" },
    { title: "Steel Industrial Warehouse", bid: "$6,000", when: "3d", status: "Won", color: "green" },
    { title: "Geotech Highway Bridge", bid: "$24,800", when: "5d", status: "Declined", color: "rose" },
  ];

  const contracts = [
    { title: "Boutique Hotel — DD", client: "Aurora Hospitality", value: "$11,200", ms: 3, total: 5, due: `${t("common.due")} Apr 8` },
    { title: "Steel Warehouse — PEB", client: "NorthLogix Logistics", value: "$6,000", ms: 2, total: 4, due: `${t("common.due")} Apr 1` },
    { title: "12-Story Tower Structural", client: "Meridian Developments", value: "$22,500", ms: 1, total: 6, due: `${t("common.due")} Apr 12` },
  ];

  const files = [
    { name: "Tower_Structural_DD_v3.rvt", size: "184 MB", when: "2h", type: "Revit" },
    { name: "Calculation_Report_R2.pdf", size: "12 MB", when: "1d", type: "PDF" },
    { name: "Foundation_Plan.dwg", size: "6 MB", when: "2d", type: "DWG" },
    { name: "Federated_Model.nwd", size: "320 MB", when: "3d", type: "NWD" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{t("ed.welcome")}</p>
          <h1 className="text-3xl font-bold tracking-tight">{t("ed.title")}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<IconUpload width={16} height={16} />}>{t("ed.uploadDel")}</Button>
          <Button icon={<IconBolt width={16} height={16} />}>{t("ed.findProj")}</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("ed.earningsMtd")} value="$18,420" change="+24%" icon={<IconWallet width={20} height={20} />} />
        <StatCard label={t("ed.activeContracts")} value="4" change="1 new" icon={<IconBriefcase width={20} height={20} />} />
        <StatCard label={t("ed.winRate")} value="72%" change="+8 pts" icon={<IconTrend width={20} height={20} />} />
        <StatCard label={t("ed.avgRating")} value="4.9 / 5" change={`127 ${t("common.reviews")}`} icon={<IconStar width={20} height={20} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Earnings */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">{t("ed.earnings")}</h2>
              <p className="text-xs text-slate-500">{t("ed.netFee")}</p>
            </div>
            <div className="flex gap-1 text-xs">
              {["7D", "30D", "12M", "All"].map(p => (
                <button key={p} className={`h-7 px-3 rounded-md ${p === "30D" ? "bg-electric-500 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold">$18,420.00</p>
            <p className="text-sm text-slate-500">{t("ed.pending")} <span className="font-bold text-amber-600">$6,200</span></p>
          </div>
          <div className="mt-4 text-electric-500">
            <AreaChart data={[2.1, 1.8, 2.4, 3.1, 2.7, 3.6, 4.2, 3.4, 4.8, 5.1, 4.6, 5.8, 6.4, 5.9]} />
          </div>
        </Card>

        {/* Performance */}
        <Card className="p-6 flex flex-col items-center justify-center">
          <h2 className="font-bold text-sm self-start">{t("ed.completeness")}</h2>
          <Donut value={88} label={t("common.complete")} />
          <p className="text-xs text-slate-500 text-center mt-2">{t("ed.completeMsg")}</p>
          <Button size="sm" variant="secondary" className="mt-3">{t("ed.improve")}</Button>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bids */}
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold">{t("ed.myBids")}</h2>
            <Button size="sm" variant="ghost" icon={<IconArrow width={14} height={14} />}>{t("ed.allBids")}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  <th className="text-start p-4">{t("cd.cols.project")}</th>
                  <th className="text-start p-4">{t("ed.cols.bid")}</th>
                  <th className="text-start p-4">{t("ed.cols.submitted")}</th>
                  <th className="text-start p-4">{t("ed.cols.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bids.map(b => (
                  <tr key={b.title} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="p-4 font-medium">{b.title}</td>
                    <td className="p-4 font-bold text-electric-600">{b.bid}</td>
                    <td className="p-4 text-slate-500">{b.when}</td>
                    <td className="p-4"><Badge color={b.color as any}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pipeline analytics */}
        <Card className="p-6">
          <h2 className="font-bold">{t("ed.bidAnalytics")}</h2>
          <p className="text-xs text-slate-500">{t("ed.last6")}</p>
          <div className="mt-4 text-electric-500"><BarChart data={[6, 9, 7, 14, 11, 18]} labels={["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]} /></div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xl font-bold">65</p><p className="text-[10px] text-slate-500 uppercase">{t("ed.sent")}</p></div>
            <div><p className="text-xl font-bold text-emerald-500">47</p><p className="text-[10px] text-slate-500 uppercase">{t("ed.won")}</p></div>
            <div><p className="text-xl font-bold text-rose-500">18</p><p className="text-[10px] text-slate-500 uppercase">{t("ed.lost")}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active contracts */}
        <Card className="lg:col-span-2">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold">{t("ed.activeContracts")}</h2>
          </div>
          <div className="p-5 space-y-4">
            {contracts.map(c => (
              <div key={c.title} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-electric-500/40 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs text-slate-500">{c.client}</p>
                  </div>
                  <Badge color="electric">{c.value}</Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.ms} / {c.total}</span>
                    <span className="text-slate-500">{c.due}</span>
                  </div>
                  <Progress value={(c.ms / c.total) * 100} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Files */}
        <Card>
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold">{t("ed.recentFiles")}</h2>
            <Button size="sm" variant="ghost" icon={<IconUpload width={14} height={14} />}>{t("common.upload")}</Button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {files.map(f => (
              <div key={f.name} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <span className="h-9 w-9 rounded-lg bg-electric-500/10 text-electric-600 flex items-center justify-center"><IconFile width={16} height={16} /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-[11px] text-slate-500">{f.size} · {f.when}</p>
                </div>
                <Badge>{f.type}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
