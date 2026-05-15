import { Avatar, Badge, Button, Card, Progress, VerifiedBadge } from "../components/UI";
import { IconStar, IconLocation, IconBolt, IconCheck, IconCube, IconShield, IconMessage, IconBriefcase } from "../components/Icons";
import { useI18n } from "../i18n";

export default function EngineerProfile() {
  const { t } = useI18n();

  const portfolio = [
    { title: "Nile View Residential Tower (24F)", meta: `RC structure · Cairo, EG`, gradient: "bg-gradient-to-br from-sky-500 to-indigo-700" },
    { title: "Coastal Highway Bridge", meta: "Prestressed girders · 360 m", gradient: "bg-gradient-to-br from-emerald-500 to-teal-700" },
    { title: "Hospital Seismic Retrofit", meta: "Existing structure · 8,500 m²", gradient: "bg-gradient-to-br from-amber-500 to-rose-600" },
    { title: "Steel Industrial Plant", meta: "PEB · 14,000 m²", gradient: "bg-gradient-to-br from-violet-500 to-fuchsia-700" },
  ];

  const experience = [
    { role: "Founder & Principal Structural Engineer", company: "Hassan Structural Studio", location: "Cairo", period: "2019 — Present", desc: "Lead a team of 6 engineers delivering structural design packages." },
    { role: "Senior Structural Engineer", company: "Dar Al-Handasah", location: "Cairo / Riyadh", period: "2014 — 2019", desc: "Lead engineer on multiple high-rise & mixed-use projects." },
    { role: "Structural Engineer", company: "ECG Engineering Consultants", location: "Cairo", period: "2011 — 2014", desc: "Designed RC and post-tensioned slab systems." },
  ];

  const reviews = [
    { name: "Hana Park", role: "Director, Meridian Developments", date: "2 weeks ago", text: "Layla delivered a flawless structural package two weeks ahead of schedule. Communication was exceptional." },
    { name: "Carlos Mendes", role: "Owner, MendesCorp", date: "1 month ago", text: "Top-tier engineer. The attention to detail in the calculations report and Revit model was the best I've seen in 15 years." },
    { name: "Anna Fischer", role: "Architect, Studio R", date: "2 months ago", text: "Brilliant collaborator. She suggested two structural reconfigurations that saved 11% in concrete volume." },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cover */}
      <Card className="overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-navy-900 via-navy-800 to-electric-700 grid-bg relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.4),_transparent_50%)]" />
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col md:flex-row md:items-end gap-5">
          <div className="ring-4 ring-white dark:ring-slate-900 rounded-full">
            <Avatar name="Layla Hassan" size={104} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">Layla Hassan, P.E.</h1>
              <VerifiedBadge size={18} />
              <Badge color="amber"><IconBolt width={10} height={10} /> {t("common.topRated")}</Badge>
            </div>
            <p className="mt-1 text-slate-500">{t("ep.role")}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1"><IconLocation width={14} height={14} />Cairo, Egypt</span>
              <span className="flex items-center gap-1"><IconStar width={14} height={14} className="text-amber-500" /><span className="text-slate-900 dark:text-white font-semibold">4.9</span> (127 {t("common.reviews")})</span>
              <span>· {t("ep.available")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<IconMessage width={14} height={14} />}>{t("common.message")}</Button>
            <Button icon={<IconBriefcase width={14} height={14} />}>{t("common.hire")}</Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* About */}
          <Card className="p-6">
            <h2 className="text-lg font-bold">{t("ep.about")}</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">{t("ep.aboutText")}</p>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: t("ep.s.projects"), v: "64" },
                { l: t("ep.s.onTime"), v: "98%" },
                { l: t("ep.s.repeat"), v: "47%" },
                { l: t("ep.s.response"), v: "< 1h" },
              ].map(s => (
                <div key={s.l} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{s.l}</p>
                  <p className="mt-1 text-xl font-bold">{s.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Portfolio */}
          <Card>
            <div className="p-6 pb-0 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("ep.portfolio")}</h2>
              <Button size="sm" variant="ghost">{t("common.viewAll")}</Button>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              {portfolio.map(item => (
                <div key={item.title} className="group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-electric-500/50 transition">
                  <div className={`h-40 ${item.gradient} relative grid-bg`}>
                    <div className="absolute inset-0 flex items-center justify-center text-white/90"><IconCube width={48} height={48} /></div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Experience */}
          <Card className="p-6">
            <h2 className="text-lg font-bold">{t("ep.experience")}</h2>
            <div className="mt-4 space-y-5">
              {experience.map((e, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-electric-500/10 text-electric-600 flex items-center justify-center font-bold shrink-0">{e.company[0]}</div>
                  <div className="flex-1 pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <p className="font-semibold">{e.role}</p>
                      <p className="text-xs text-slate-500">{e.period}</p>
                    </div>
                    <p className="text-sm text-slate-500">{e.company} · {e.location}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Reviews */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("ep.reviews")}</h2>
              <div className="flex items-center gap-1 text-sm">
                <IconStar width={16} height={16} className="text-amber-500" />
                <span className="font-bold">4.9</span><span className="text-slate-500">· 127 {t("common.reviews")}</span>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-5 gap-3">
              {[5, 4, 3, 2, 1].map(s => (
                <div key={s} className="text-xs">
                  <p className="text-slate-500">{s} {t("ep.starRating")}</p>
                  <Progress value={s === 5 ? 88 : s === 4 ? 9 : 1} />
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-5">
              {reviews.map((r, i) => (
                <div key={i} className="pb-5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} size={40} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{r.name}</p>
                        <div className="flex">{[...Array(5)].map((_, k) => <IconStar key={k} width={12} height={12} className="text-amber-500" />)}</div>
                      </div>
                      <p className="text-xs text-slate-500">{r.role} · {r.date}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{r.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("ep.hourlyRate")}</p>
            <p className="mt-1 text-3xl font-bold text-electric-600">$75 <span className="text-sm text-slate-500 font-medium">{t("common.perHour")}</span></p>
            <Button className="mt-4 w-full">{t("ep.sendOffer")}</Button>
            <Button variant="secondary" className="mt-2 w-full">{t("ep.inviteToProject")}</Button>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-sm">{t("ep.verifications")}</h3>
            <div className="mt-3 space-y-2.5">
              {[t("ep.v1"), t("ep.v2"), t("ep.v3"), t("ep.v4")].map(label => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><IconCheck width={14} height={14} /></span>
                  {label}
                </div>
              ))}
            </div>
            <div className="hidden"><IconShield /></div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-sm">{t("common.skills")}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["ETABS", "SAP2000", "Revit", "Concrete Design", "Steel Design", "Seismic", "Foundations", "Post-Tension", "ISO 19650", "Bridge Design"].map(s => (
                <Badge key={s} color="electric">{s}</Badge>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-bold text-sm">{t("ep.certs")}</h3>
            <div className="mt-3 space-y-3 text-sm">
              {[
                { tt: t("ep.cert1.t"), o: t("ep.cert1.o") },
                { tt: t("ep.cert2.t"), o: t("ep.cert2.o") },
                { tt: t("ep.cert3.t"), o: t("ep.cert3.o") },
              ].map(c => (
                <div key={c.tt}>
                  <p className="font-medium">{c.tt}</p>
                  <p className="text-xs text-slate-500">{c.o}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
