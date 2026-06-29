"use client";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { useI18n } from "@/i18n";

export type LegalSection = {
  titleKey: string;
  paragraphKeys: string[];
};

function LegalBody({
  updatedKey,
  sections,
}: {
  updatedKey: string;
  sections: LegalSection[];
}) {
  const { t } = useI18n();

  return (
    <>
      <p className="text-sm text-slate-500 dark:text-slate-400 not-prose -mt-2 mb-8">
        {t(updatedKey)}
      </p>
      {sections.map((section) => (
        <section key={section.titleKey} className="mb-8 last:mb-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0">
            {t(section.titleKey)}
          </h2>
          {section.paragraphKeys.map((key) => (
            <p key={key} className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(key)}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}

export function LegalDocumentPage({
  titleKey,
  subtitleKey,
  updatedKey,
  sections,
}: {
  titleKey: string;
  subtitleKey: string;
  updatedKey: string;
  sections: LegalSection[];
}) {
  const { t } = useI18n();

  return (
    <MarketingPage title={t(titleKey)} subtitle={t(subtitleKey)}>
      <LegalBody updatedKey={updatedKey} sections={sections} />
    </MarketingPage>
  );
}
