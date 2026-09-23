import { ProjectsPage } from "@/features/projects/components/ProjectsPage";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = "https://clinkaeng.com";
  return {
    title: "Engineering Projects | CLINKA",
    description: "Find engineering freelance jobs and architectural projects. Bid on active projects and collaborate with global clients on CLINKA.",
    alternates: {
      canonical: `${baseUrl}/${locale}/projects`,
      languages: {
        en: `${baseUrl}/en/projects`,
        ar: `${baseUrl}/ar/projects`,
        "x-default": `${baseUrl}/en/projects`,
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
    "serviceType": "Engineering Projects",
    "provider": {
      "@type": "Organization",
      "name": "CLINKA"
    },
    "url": `${baseUrl}/${locale}/projects`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProjectsPage />
    </>
  );
}