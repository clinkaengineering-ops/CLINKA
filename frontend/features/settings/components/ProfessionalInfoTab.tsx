"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, Input } from "@/components/UI";
import { IconCheck } from "@/components/Icons";
import { useAccountSettings } from "../hooks/useAccountSettings";

export function ProfessionalInfoTab() {
  const { me, loading, saving, error, save } = useAccountSettings();

  const [professionalHeadline, setProfessionalHeadline] = useState("");
  const [hourlyRateUSD, setHourlyRateUSD] = useState<string>("");
  const [startingProjectPriceUSD, setStartingProjectPriceUSD] = useState<string>("");
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [availabilityStatus, setAvailabilityStatus] = useState("AVAILABLE_NOW");

  useEffect(() => {
    if (me?.profile) {
      setProfessionalHeadline(me.profile.professionalHeadline ?? "");
      setHourlyRateUSD(me.profile.hourlyRateUSD?.toString() ?? "");
      setStartingProjectPriceUSD(me.profile.startingProjectPriceUSD?.toString() ?? "");
      setYearsOfExperience(me.profile.yearsOfExperience?.toString() ?? "");
      setAvailabilityStatus(me.profile.availabilityStatus ?? "AVAILABLE_NOW");
    }
  }, [me?.profile]);

  if (loading) {
    return <Card className="p-6 text-sm text-slate-500">Loading...</Card>;
  }

  async function handleSave() {
    await save({
      professionalHeadline: professionalHeadline || null,
      hourlyRateUSD: hourlyRateUSD ? Number(hourlyRateUSD) : null,
      startingProjectPriceUSD: startingProjectPriceUSD ? Number(startingProjectPriceUSD) : null,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
      availabilityStatus,
    });
  }

  return (
    <Card className="p-6">
      <h2 className="font-bold">Professional Information</h2>
      <p className="text-sm text-slate-500">Update your professional details, pricing, and availability.</p>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Field label="Professional Headline">
            <Input
              value={professionalHeadline}
              onChange={(e) => setProfessionalHeadline(e.target.value)}
              placeholder="e.g. Senior Structural Engineer at Dar Al-Handasah"
            />
          </Field>
        </div>

        <Field label="Years of Experience">
          <Input
            type="number"
            min="0"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="e.g. 10"
          />
        </Field>

        <Field label="Availability Status">
          <select
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-electric-500/30"
          >
            <option value="AVAILABLE_NOW">Available Now</option>
            <option value="OPEN_TO_WORK">Open To Work</option>
            <option value="AVAILABLE_NEXT_WEEK">Available Next Week</option>
            <option value="AVAILABLE_NEXT_MONTH">Available Next Month</option>
            <option value="UNAVAILABLE">Unavailable / Busy</option>
          </select>
        </Field>

        <Field label="Hourly Rate (USD)">
          <Input
            type="number"
            min="0"
            value={hourlyRateUSD}
            onChange={(e) => setHourlyRateUSD(e.target.value)}
            placeholder="e.g. 50"
          />
        </Field>

        <Field label="Starting Project Budget (USD)">
          <Input
            type="number"
            min="0"
            value={startingProjectPriceUSD}
            onChange={(e) => setStartingProjectPriceUSD(e.target.value)}
            placeholder="e.g. 1000"
          />
        </Field>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            if (me?.profile) {
              setProfessionalHeadline(me.profile.professionalHeadline ?? "");
              setHourlyRateUSD(me.profile.hourlyRateUSD?.toString() ?? "");
              setStartingProjectPriceUSD(me.profile.startingProjectPriceUSD?.toString() ?? "");
              setYearsOfExperience(me.profile.yearsOfExperience?.toString() ?? "");
              setAvailabilityStatus(me.profile.availabilityStatus ?? "AVAILABLE_NOW");
            }
          }}
        >
          Cancel
        </Button>
        <Button
          disabled={saving}
          onClick={handleSave}
          icon={<IconCheck width={14} height={14} />}
        >
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}
