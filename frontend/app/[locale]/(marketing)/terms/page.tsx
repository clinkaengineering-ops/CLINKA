import type { Metadata } from "next";
import { TermsPage } from "@/features/marketing/pages/TermsPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinka.com";
  return {
    title: "Terms of Service | CLINKA",
    description: "Review the CLINKA Terms of Service governing the use of our engineering marketplace for clients and freelancers.",
    alternates: {
      canonical: `${baseUrl}/${locale}/terms`,
      languages: {
        en: `${baseUrl}/en/terms`,
        ar: `${baseUrl}/ar/terms`,
        "x-default": `${baseUrl}/en/terms`,
      },
    },
  };
}

export default function Page() {
  return <TermsPage />;
}
