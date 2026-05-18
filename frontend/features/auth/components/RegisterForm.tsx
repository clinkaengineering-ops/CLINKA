"use client";
import { useState } from "react";
import Link from "next/link";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { cn } from "@/utils/cn";
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  
} from "@/components/UI";
import { IconArrow, IconBriefcase, IconCheck, IconLock, IconMail, IconUser } from "@/components/Icons";

type Role = "CLIENT" | "ENGINEER";
type Specialty = "CIVIL" | "ARCHITECTURAL";
type DocumentType = "collegeIdUrl" | "certificateUrl" | "syndicateCardUrl";

export function RegisterForm() {
  const { registerClient, registerEngineer, loading, error } = useRegister();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "" as Specialty,
    bio: "",
    documentType: "" as DocumentType,
    file: null as File | null,
  });

  const stepLabels = ["Account type", "Your details", "Profile", "Verification"];

  async function handleDone() {
    if (role === "CLIENT") {
      await registerClient({
        name: form.name,
        email: form.email,
        password: form.password,
      });
    } else {
      await registerEngineer({
        name: form.name,
        email: form.email,
        password: form.password,
        specialty: form.specialty,
        bio: form.bio,
        documentType: form.documentType,
        file: form.file!,
      });
    }
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-electric-600 font-bold">
        Step {step} of {role === "CLIENT" ? 2 : stepLabels.length}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{stepLabels[step - 1]}</h1>

      {/* Progress bar */}
      <div className="mt-3 flex gap-2">
        {(role === "CLIENT" ? [1, 2] : [1, 2, 3, 4]).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition", i + 1 <= step ? "bg-electric-500" : "bg-slate-200 dark:bg-slate-800")} />
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <div className="mt-6">

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <div className="space-y-3">
            {[
                { role: "ENGINEER" as Role, title: "I'm an Engineer", desc: "Civil or architectural - offer your services", icon: <IconBriefcase width={20} height={20} /> },
                { role: "CLIENT" as Role, title: "I'm a Client", desc: "Post projects and hire verified engineers", icon: <IconUser width={20} height={20} /> },
            ].map(o => (
              <button
                key={o.role}
                onClick={() => setRole(o.role)}
                className={cn(
                    "w-full p-4 rounded-xl border text-start transition flex items-center gap-3 group",
                  role === o.role
                      ? "border-electric-500 bg-electric-500/5"
                      : "border-slate-200 dark:border-slate-800 hover:border-electric-500/60 hover:bg-electric-500/5"
                )}
              >
                  <span className="h-10 w-10 rounded-lg bg-electric-500/10 text-electric-600 flex items-center justify-center group-hover:scale-110 transition">
                    {o.icon}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{o.title}</p>
                    <p className="text-xs text-slate-500">{o.desc}</p>
                  </div>
                  {role === o.role ? <IconCheck width={18} height={18} className="text-electric-500" /> : <IconArrow width={16} height={16} className="text-slate-400 rtl:rotate-180" />}
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Basic details */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Full name">
              <Input
                icon={<IconUser width={16} height={16} />}
                type="text"
                placeholder="Mohamed Talal"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              < Input
                icon={<IconMail width={16} height={16} />}
                type="email"
                placeholder="you@firm.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <Input
                icon={<IconLock width={16} height={16} />}
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          </div>
        )}

        {/* Step 3 — Specialty + Bio (Engineer only) */}
        {step === 3 && role === "ENGINEER" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Specialty</label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                {(["CIVIL", "ARCHITECTURAL"] as Specialty[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, specialty: s })}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-semibold text-center transition",
                      form.specialty === s
                        ? "border-electric-500 bg-electric-500/5 text-electric-600"
                        : "border-slate-200 dark:border-slate-800 hover:border-electric-500/60"
                    )}
                  >
                    {s === "CIVIL" ? "Civil" : "Architectural"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bio <span className="text-slate-400 font-normal">(optional)</span></label>
              <Textarea
                rows={3}
                placeholder="Tell clients about your experience..."
                value={form.bio}
                onChange={(e:any) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 4 — Document upload (Engineer only) */}
        {step === 4 && role === "ENGINEER" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Upload one document to verify your engineering credentials</p>
            <div className="space-y-3">
              {([
                { type: "collegeIdUrl", label: "College ID" },
                { type: "certificateUrl", label: "Engineering Certificate" },
                { type: "syndicateCardUrl", label: "Syndicate Card" },
              ] as { type: DocumentType; label: string }[]).map(d => (
                <label
                  key={d.type}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border border-dashed cursor-pointer transition",
                    form.documentType === d.type
                      ? "border-electric-500 bg-electric-500/5"
                      : "border-slate-300 dark:border-slate-700 hover:border-electric-500"
                  )}
                >
                  <span className="text-sm font-medium">{d.label}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setForm({ ...form, documentType: d.type, file: e.target.files[0] });
                      }
                    }}
                  />
                  <span className="text-xs text-electric-600 font-semibold">
                    {form.documentType === d.type && form.file ? form.file.name : "Upload"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between gap-3">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30"
        >
          Back
        </button>

        {step < (role === "CLIENT" ? 2 : 4) ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && !role}
            icon={<IconArrow width={14} height={14} />}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleDone}
            disabled={loading}
            icon={<IconCheck width={14} height={14} />}
          >
            {loading ? "Creating account..." : "Finish"}
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-electric-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}
