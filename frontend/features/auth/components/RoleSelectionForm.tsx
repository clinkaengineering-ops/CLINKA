"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/features/auth/api/auth.api";
import useAuthStore from "@/store/authStore";
import { cn } from "@/utils/cn";
import { Button, Card, Field } from "@/components/UI";
import { IconArrow, IconBriefcase, IconCheck, IconUser } from "@/components/Icons";
import { useI18n } from "@/i18n";

type Role = "CLIENT" | "ENGINEER";
type Specialty = "CIVIL" | "ARCHITECTURAL";

const NATIONALITIES = [
  "Afghan", "Albanian", "Algerian", "Argentine", "Armenian", "Australian",
  "Austrian", "Azerbaijani", "Bangladeshi", "Belarusian", "Belgian", "Bolivian",
  "Bosnian", "Brazilian", "British", "Bulgarian", "Cambodian", "Cameroonian",
  "Canadian", "Chilean", "Chinese", "Colombian", "Congolese", "Croatian", "Cuban",
  "Czech", "Danish", "Dutch", "Ecuadorian", "Egyptian", "Emirati", "English",
  "Estonian", "Ethiopian", "Finnish", "French", "Georgian", "German", "Ghanaian",
  "Greek", "Guatemalan", "Hungarian", "Indian", "Indonesian", "Iranian", "Iraqi",
  "Irish", "Israeli", "Italian", "Jamaican", "Japanese", "Jordanian", "Kazakh",
  "Kenyan", "Kuwaiti", "Lebanese", "Libyan", "Lithuanian", "Malaysian", "Mexican",
  "Mongolian", "Moroccan", "Nepalese", "New Zealander", "Nigerian", "Norwegian",
  "Omani", "Pakistani", "Palestinian", "Peruvian", "Philippine", "Polish",
  "Portuguese", "Qatari", "Romanian", "Russian", "Saudi", "Scottish", "Serbian",
  "Singaporean", "Slovak", "Slovenian", "Somali", "South African", "South Korean",
  "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian", "Taiwanese",
  "Tanzanian", "Thai", "Tunisian", "Turkish", "Ukrainian", "Uruguayan", "American",
  "Uzbek", "Venezuelan", "Vietnamese", "Yemeni", "Zimbabwean", "Other",
];

export function RoleSelectionForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const token = searchParams.get("token");

  const [role, setRole] = useState<Role | null>(null);
  const [specialty, setSpecialty] = useState<Specialty | "">("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <p className="text-rose-500 font-medium">Invalid or missing session token. Please try signing in again.</p>
        <Button className="mt-4" onClick={() => router.push("/login")}>Go to Login</Button>
      </Card>
    );
  }

  async function handleComplete() {
    if (!role) {
      setError(t("auth.selectRole"));
      return;
    }
    if (role === "ENGINEER" && (!specialty || !nationality)) {
      setError("Please select your specialty and nationality.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authApi.googleCompleteRegistration({
        token: token!,
        role,
        specialty: specialty || undefined,
        nationality: nationality || undefined,
        bio: bio.trim() || undefined,
      });

      const user = result.data?.data || result.data;
      if (user) {
         setUser(user);
         if (user.role === "ENGINEER") {
           router.push("/register?role=engineer&step=3&google=1");
         } else {
           router.push(user.role === "ADMIN" ? "/admin" : "/dashboard");
         }
      } else {
         router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">Select Your Role</h1>
      <p className="text-slate-500 mt-1">Please select a role to complete your Google registration.</p>

      {error && <p className="text-rose-500 text-sm mt-3">{error}</p>}

      <div className="mt-6 space-y-3">
        {[
          {
            role: "ENGINEER" as Role,
            title: t("auth.iEngShort"),
            desc: t("auth.iEngShortDesc"),
            icon: <IconBriefcase width={20} height={20} />,
          },
          {
            role: "CLIENT" as Role,
            title: t("auth.iClientShort"),
            desc: t("auth.iClientShortDesc"),
            icon: <IconUser width={20} height={20} />,
          },
        ].map((o) => (
          <button
            key={o.role}
            type="button"
            onClick={() => {
              setRole(o.role);
              setError("");
            }}
            className={cn(
              "w-full p-4 rounded-xl border text-start transition flex items-center gap-3 group",
              role === o.role
                ? "border-brand-copper bg-brand-copper/5"
                : "border-slate-200 dark:border-slate-800 hover:border-brand-copper/60 hover:bg-brand-copper/5",
            )}
          >
            <span className="h-10 w-10 rounded-lg bg-brand-copper/10 text-brand-copper flex items-center justify-center group-hover:scale-110 transition">
              {o.icon}
            </span>
            <div className="flex-1">
              <p className="font-semibold">{o.title}</p>
              <p className="text-xs text-slate-500">{o.desc}</p>
            </div>
            {role === o.role ? (
              <IconCheck width={18} height={18} className="text-brand-copper" />
            ) : (
              <IconArrow width={16} height={16} className="text-slate-400 rtl:rotate-180" />
            )}
          </button>
        ))}
      </div>

      {role === "ENGINEER" && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("auth.specialty")}
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              {(["CIVIL", "ARCHITECTURAL"] as Specialty[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecialty(s)}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-semibold text-center transition",
                    specialty === s
                      ? "border-electric-500 bg-electric-500/5 text-electric-600"
                      : "border-slate-200 dark:border-slate-800 hover:border-electric-500/60",
                  )}
                >
                  {s === "CIVIL" ? t("auth.civil") : t("auth.architectural")}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("em.nationality")}>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="mt-1.5 w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
            >
              <option value="">{t("auth.nationalityPh")}</option>
              {NATIONALITIES.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("auth.bio")} <span className="text-slate-400 font-normal">({t("auth.optional")})</span>
            </label>
            <textarea
              rows={3}
              placeholder={t("auth.bioPh")}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1.5 w-full rounded-lg border bg-white dark:bg-slate-900 p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 border-slate-200 dark:border-slate-800 focus:ring-electric-500/30"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={loading || !role || (role === "ENGINEER" && (!specialty || !nationality))}
          icon={<IconCheck width={14} height={14} />}
        >
          {loading ? t("auth.creating") : t("auth.continue")}
        </Button>
      </div>
    </Card>
  );
}
