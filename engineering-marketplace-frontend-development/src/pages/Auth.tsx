import { useState } from "react";
import { Button, Input } from "../components/UI";
import { IconMail, IconLock, IconUser, IconArrow, IconCheck, IconBriefcase, IconLogo, IconEye } from "../components/Icons";
import type { PageKey } from "../components/AppShell";
import { cn } from "../utils/cn";
import { useI18n } from "../i18n";

type Mode = "login" | "register" | "forgot" | "onboard";

export default function Auth({ setPage }: { setPage: (p: PageKey) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <button onClick={() => setPage("landing")} className="flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-electric-400 to-navy-700 flex items-center justify-center text-white"><IconLogo width={20} height={20} /></div>
            <span className="font-bold">CLINKA</span>
          </button>

          {mode === "login" && <Login onSwitch={(m) => { setMode(m); setStep(1); }} setPage={setPage} />}
          {mode === "register" && <Register onSwitch={(m) => { setMode(m); setStep(1); }} onContinue={() => setMode("onboard")} />}
          {mode === "forgot" && <Forgot onBack={() => setMode("login")} />}
          {mode === "onboard" && <Onboard step={step} setStep={setStep} onDone={() => setPage("client")} />}
        </div>
      </div>

      {/* Right: visual panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -bottom-40 -end-40 h-[600px] w-[600px] bg-electric-500/30 blur-[120px] rounded-full" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-electric-500/30 bg-electric-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-electric-300">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-400 animate-pulse" /> {t("auth.live")}
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight">{t("auth.heroTitle")}</h2>
            <p className="mt-4 text-white/70">{t("auth.heroSub")}</p>
          </div>

          <div className="space-y-3">
            {[t("auth.heroF1"), t("auth.heroF2"), t("auth.heroF3"), t("auth.heroF4")].map(f => (
              <div key={f} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur">
                <span className="h-7 w-7 rounded-lg bg-electric-500/30 text-electric-300 flex items-center justify-center"><IconCheck width={14} height={14} /></span>
                <p className="text-sm">{f}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/60">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {["LH", "MC", "SR", "AF"].map((i, k) => (
                <div key={k} className="h-7 w-7 rounded-full bg-gradient-to-br from-electric-400 to-navy-600 border-2 border-navy-950 text-[10px] flex items-center justify-center font-bold">{i}</div>
              ))}
            </div>
            <span>{t("auth.joined")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ onSwitch, setPage }: { onSwitch: (m: Mode) => void; setPage: (p: PageKey) => void }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold">{t("auth.welcome")}</h1>
      <p className="text-sm text-slate-500 mt-1">{t("auth.signinSub")}</p>
      <div className="mt-6 space-y-4">
        <Field label={t("auth.email")}>
          <Input icon={<IconMail width={16} height={16} />} placeholder="you@firm.com" defaultValue="layla@hassan-structural.com" />
        </Field>
        <Field label={t("auth.password")} right={<button onClick={() => onSwitch("forgot")} className="text-xs text-electric-600 hover:text-electric-500 font-medium">{t("auth.forgot")}</button>}>
          <div className="relative">
            <Input icon={<IconLock width={16} height={16} />} type="password" placeholder="••••••••" defaultValue="password123" />
            <IconEye width={16} height={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-electric-500" defaultChecked />
          {t("auth.keep")}
        </label>
        <Button className="w-full" onClick={() => setPage("client")} icon={<IconArrow width={14} height={14} />}>{t("auth.signin")}</Button>
        <Divider />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="!h-11">Google</Button>
          <Button variant="secondary" className="!h-11">SSO</Button>
        </div>
        <p className="text-center text-sm text-slate-500">{t("auth.noAccount")} <button onClick={() => onSwitch("register")} className="text-electric-600 font-semibold hover:underline">{t("auth.createOne")}</button></p>
      </div>
    </div>
  );
}

function Register({ onSwitch, onContinue }: { onSwitch: (m: Mode) => void; onContinue: () => void }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold">{t("auth.create")}</h1>
      <p className="text-sm text-slate-500 mt-1">{t("auth.createSub")}</p>
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("auth.first")}><Input icon={<IconUser width={16} height={16} />} placeholder="Layla" /></Field>
          <Field label={t("auth.last")}><Input placeholder="Hassan" /></Field>
        </div>
        <Field label={t("auth.workEmail")}><Input icon={<IconMail width={16} height={16} />} placeholder="you@firm.com" /></Field>
        <Field label={t("auth.password")}><Input icon={<IconLock width={16} height={16} />} type="password" placeholder={t("auth.passHelp")} /></Field>
        <p className="text-xs text-slate-500">{t("auth.tos")}</p>
        <Button className="w-full" onClick={onContinue} icon={<IconArrow width={14} height={14} />}>{t("common.continue")}</Button>
        <p className="text-center text-sm text-slate-500">{t("auth.have")} <button onClick={() => onSwitch("login")} className="text-electric-600 font-semibold hover:underline">{t("auth.signin")}</button></p>
      </div>
    </div>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-bold">{t("auth.reset")}</h1>
      <p className="text-sm text-slate-500 mt-1">{t("auth.resetSub")}</p>
      <div className="mt-6 space-y-4">
        <Field label={t("auth.email")}><Input icon={<IconMail width={16} height={16} />} placeholder="you@firm.com" /></Field>
        <Button className="w-full">{t("auth.sendReset")}</Button>
        <button onClick={onBack} className="text-sm text-electric-600 font-semibold hover:underline">{t("auth.backToSignin")}</button>
      </div>
    </div>
  );
}

function Onboard({ step, setStep, onDone }: { step: number; setStep: (s: number) => void; onDone: () => void }) {
  const { t } = useI18n();
  const stepLabels = [t("auth.s1"), t("auth.s2"), t("auth.s3"), t("auth.s4")];
  return (
    <div className="animate-fade-up">
      <p className="text-xs uppercase tracking-wider text-electric-600 font-bold">{t("auth.step")} {step} {t("auth.of")} {stepLabels.length}</p>
      <h1 className="mt-1 text-2xl font-bold">{stepLabels[step - 1]}</h1>
      <div className="mt-3 flex gap-2">
        {stepLabels.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition", i + 1 <= step ? "bg-electric-500" : "bg-slate-200 dark:bg-slate-800")} />
        ))}
      </div>

      <div className="mt-6">
        {step === 1 && (
          <div className="space-y-3">
            {[
              { tt: t("auth.iEng"), d: t("auth.iEngDesc"), i: <IconBriefcase width={20} height={20} /> },
              { tt: t("auth.iClient"), d: t("auth.iClientDesc"), i: <IconUser width={20} height={20} /> },
            ].map(o => (
              <button key={o.tt} className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-electric-500/60 hover:bg-electric-500/5 text-start transition flex items-center gap-3 group">
                <span className="h-10 w-10 rounded-lg bg-electric-500/10 text-electric-600 flex items-center justify-center group-hover:scale-110 transition">{o.i}</span>
                <div className="flex-1"><p className="font-semibold">{o.tt}</p><p className="text-xs text-slate-500">{o.d}</p></div>
                <IconArrow width={16} height={16} className="text-slate-400 rtl:rotate-180" />
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {[t("disc.structural"), t("disc.architecture"), t("disc.mep"), t("disc.bim"), t("disc.civil"), t("disc.geotech"), t("disc.pm"), t("disc.contractor")].map(d => (
              <button key={d} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-electric-500/60 hover:bg-electric-500/5 text-sm font-semibold text-center transition">{d}</button>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <Field label={t("auth.displayName")}><Input placeholder="Layla Hassan" /></Field>
            <Field label={t("auth.hourly")}><Input placeholder="75" /></Field>
            <Field label={t("auth.bio")}><textarea rows={3} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm" placeholder={t("auth.bioPh")} /></Field>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p className="text-slate-500">{t("auth.uploadOne")}</p>
            {[t("ep.v2"), t("ep.v1"), t("ep.v3")].map(d => (
              <div key={d} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-electric-500 transition">
                <span>{d}</span>
                <Button size="sm" variant="ghost">{t("common.upload")}</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>{t("common.back")}</Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} icon={<IconArrow width={14} height={14} />}>{t("common.continue")}</Button>
        ) : (
          <Button onClick={onDone} icon={<IconCheck width={14} height={14} />}>{t("auth.finish")}</Button>
        )}
      </div>
    </div>
  );
}

const Field = ({ label, right, children }: { label: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {right}
    </div>
    {children}
  </div>
);

const Divider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">or</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);
