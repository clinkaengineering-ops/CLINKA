"use client";

import {
  LegalDocumentPage,
  type LegalSection,
} from "@/features/marketing/components/LegalDocumentPage";

const termsSections: LegalSection[] = [
  { titleKey: "legal.terms.s1.title", paragraphKeys: ["legal.terms.s1.p1"] },
  { titleKey: "legal.terms.s2.title", paragraphKeys: ["legal.terms.s2.p1"] },
  {
    titleKey: "legal.terms.s3.title",
    paragraphKeys: ["legal.terms.s3.p1", "legal.terms.s3.p2"],
  },
  {
    titleKey: "legal.terms.s4.title",
    paragraphKeys: ["legal.terms.s4.p1", "legal.terms.s4.p2"],
  },
  {
    titleKey: "legal.terms.s5.title",
    paragraphKeys: ["legal.terms.s5.p1", "legal.terms.s5.p2"],
  },
  {
    titleKey: "legal.terms.s6.title",
    paragraphKeys: ["legal.terms.s6.p1", "legal.terms.s6.p2"],
  },
  {
    titleKey: "legal.terms.s7.title",
    paragraphKeys: ["legal.terms.s7.p1", "legal.terms.s7.p2"],
  },
  {
    titleKey: "legal.terms.s8.title",
    paragraphKeys: ["legal.terms.s8.p1", "legal.terms.s8.p2"],
  },
  { titleKey: "legal.terms.s9.title", paragraphKeys: ["legal.terms.s9.p1"] },
  { titleKey: "legal.terms.s10.title", paragraphKeys: ["legal.terms.s10.p1"] },
  { titleKey: "legal.terms.s11.title", paragraphKeys: ["legal.terms.s11.p1"] },
  { titleKey: "legal.terms.s12.title", paragraphKeys: ["legal.terms.s12.p1"] },
];

export function TermsPage() {
  return (
    <LegalDocumentPage
      titleKey="legal.terms.title"
      subtitleKey="legal.terms.subtitle"
      updatedKey="legal.terms.updated"
      sections={termsSections}
    />
  );
}
