"use client";

import {
  LegalDocumentPage,
  type LegalSection,
} from "@/features/marketing/components/LegalDocumentPage";

const privacySections: LegalSection[] = [
  { titleKey: "legal.privacy.s1.title", paragraphKeys: ["legal.privacy.s1.p1"] },
  {
    titleKey: "legal.privacy.s2.title",
    paragraphKeys: ["legal.privacy.s2.p1", "legal.privacy.s2.p2"],
  },
  {
    titleKey: "legal.privacy.s3.title",
    paragraphKeys: ["legal.privacy.s3.p1", "legal.privacy.s3.p2"],
  },
  {
    titleKey: "legal.privacy.s4.title",
    paragraphKeys: ["legal.privacy.s4.p1", "legal.privacy.s4.p2"],
  },
  { titleKey: "legal.privacy.s5.title", paragraphKeys: ["legal.privacy.s5.p1"] },
  {
    titleKey: "legal.privacy.s6.title",
    paragraphKeys: ["legal.privacy.s6.p1", "legal.privacy.s6.p2"],
  },
  { titleKey: "legal.privacy.s7.title", paragraphKeys: ["legal.privacy.s7.p1"] },
  { titleKey: "legal.privacy.s8.title", paragraphKeys: ["legal.privacy.s8.p1"] },
];

export function PrivacyPage() {
  return (
    <LegalDocumentPage
      titleKey="legal.privacy.title"
      subtitleKey="legal.privacy.subtitle"
      updatedKey="legal.privacy.updated"
      sections={privacySections}
    />
  );
}
