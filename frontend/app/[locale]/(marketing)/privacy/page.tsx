import type { Metadata } from "next";
import { PrivacyPage } from "@/features/marketing/pages/PrivacyPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinka.com";
  return {
    title: "Privacy Policy | CLINKA",
    description: "Read the CLINKA Privacy Policy to learn how we collect, use, and protect your personal information on our engineering marketplace.",
    alternates: {
      canonical: `${baseUrl}/${locale}/privacy`,
      languages: {
        en: `${baseUrl}/en/privacy`,
        ar: `${baseUrl}/ar/privacy`,
        "x-default": `${baseUrl}/en/privacy`,
      },
    },
  };
}

export default function Page() {
  return <PrivacyPage />;
}
