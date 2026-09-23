import type { Metadata } from "next";
import { HelpCenterPage } from "@/features/support/pages/HelpCenterPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinka.com";
  return {
    title: "Help Center | CLINKA",
    description: "Get help with CLINKA — submit a support request or email our team directly for assistance with your engineering projects.",
    alternates: {
      canonical: `${baseUrl}/${locale}/help`,
      languages: {
        en: `${baseUrl}/en/help`,
        ar: `${baseUrl}/ar/help`,
        "x-default": `${baseUrl}/en/help`,
      },
    },
  };
}

export default function Page() {
  return <HelpCenterPage />;
}
