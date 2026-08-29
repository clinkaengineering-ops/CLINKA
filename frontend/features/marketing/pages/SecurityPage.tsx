"use client";

import {
  LegalDocumentPage,
  type LegalSection,
} from "@/features/marketing/components/LegalDocumentPage";

const securitySections: LegalSection[] = [
  { titleKey: "legal.security.s1.title", paragraphKeys: ["legal.security.s1.p1"] },
  {
    titleKey: "legal.security.s2.title",
    paragraphKeys: ["legal.security.s2.p1", "legal.security.s2.p2"],
  },
  {
    titleKey: "legal.security.s3.title",
    paragraphKeys: ["legal.security.s3.p1", "legal.security.s3.p2"],
  },
  {
    titleKey: "legal.security.s4.title",
    paragraphKeys: ["legal.security.s4.p1", "legal.security.s4.p2"],
  },
  {
    titleKey: "legal.security.s5.title",
    paragraphKeys: ["legal.security.s5.p1", "legal.security.s5.p2"],
  },
  { titleKey: "legal.security.s6.title", paragraphKeys: ["legal.security.s6.p1"] },
  {
    titleKey: "legal.security.s7.title",
    paragraphKeys: ["legal.security.s7.p1", "legal.security.s7.p2"],
  },
  { titleKey: "legal.security.s8.title", paragraphKeys: ["legal.security.s8.p1"] },
];

export function SecurityPage() {
  return (
    <LegalDocumentPage
      titleKey="legal.security.title"
      subtitleKey="legal.security.subtitle"
      updatedKey="legal.security.updated"
      sections={securitySections}
    />
  );
}
