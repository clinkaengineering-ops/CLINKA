import { EngineersPage } from "@/features/engineers/Pages/EngineersPage";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinkaeng.com";
  return {
    title: "Hire Top Engineers | CLINKA",
    description: "Browse and hire top-rated civil, mechanical, electrical, and architectural engineers. Find the perfect freelance engineering talent for your next project.",
    alternates: {
      canonical: `${baseUrl}/${locale}/engineers`,
      languages: {
        en: `${baseUrl}/en/engineers`,
        ar: `${baseUrl}/ar/engineers`,
        "x-default": `${baseUrl}/en/engineers`,
      },
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  const baseUrl = "https://clinkaeng.com";
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Engineering Services",
    "provider": {
      "@type": "Organization",
      "name": "CLINKA"
    },
    "url": `${baseUrl}/${locale}/engineers`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EngineersPage />
    </>
  );
}
