import type { Metadata } from "next";
import { AboutPage } from "@/features/marketing/pages/AboutPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinka.com";
  return {
    title: "About Us | CLINKA",
    description: "Learn about CLINKA's mission to connect the world's best engineering talent with clients needing top-tier architectural and civil engineering services.",
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
      languages: {
        en: `${baseUrl}/en/about`,
        ar: `${baseUrl}/ar/about`,
        "x-default": `${baseUrl}/en/about`,
      },
    },
  };
}

export default function Page() {
  return <AboutPage />;
}
