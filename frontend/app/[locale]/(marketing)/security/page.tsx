import type { Metadata } from "next";
import { SecurityPage } from "@/features/marketing/pages/SecurityPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinka.com";
  return {
    title: "Security | CLINKA",
    description: "Learn about CLINKA's commitment to data security, safe escrow payments, and protecting our engineering community.",
    alternates: {
      canonical: `${baseUrl}/${locale}/security`,
      languages: {
        en: `${baseUrl}/en/security`,
        ar: `${baseUrl}/ar/security`,
        "x-default": `${baseUrl}/en/security`,
      },
    },
  };
}

export default function Page() {
  return <SecurityPage />;
}
