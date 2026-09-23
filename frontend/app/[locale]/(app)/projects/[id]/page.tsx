import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailPanel } from "@/features/projects/components/ProjectDetailPanel";
import type { Project } from "@/features/projects/api/project.api";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

async function getProject(id: string): Promise<Project | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
  try {
    const res = await fetch(`${baseUrl}/projects/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const project = await getProject(params.id);

  if (!project) {
    return { title: "Project Not Found" };
  }

  const { locale } = params;

  return {
    title: `${project.title} | CLINKA Projects`,
    description: project.description.slice(0, 155) + (project.description.length > 155 ? "..." : ""),
    alternates: {
      canonical: `https://clinkaeng.com/${locale}/projects/${project.id}`,
      languages: {
        en: `https://clinkaeng.com/en/projects/${project.id}`,
        ar: `https://clinkaeng.com/ar/projects/${project.id}`,
        "x-default": `https://clinkaeng.com/en/projects/${project.id}`,
      },
    },
    openGraph: {
      title: project.title,
      description: project.description.slice(0, 155),
      url: `https://clinkaeng.com/${locale}/projects/${project.id}`,
      type: "website",
    },
  };
}

export default async function ProjectPage(props: Props) {
  const params = await props.params;
  const project = await getProject(params.id);

  if (!project) {
    notFound();
  }

  const { locale } = params;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: project.title,
    description: project.description,
    url: `https://clinkaeng.com/${locale}/projects/${project.id}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Projects",
        "item": `https://clinkaeng.com/${locale}/projects`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": project.title,
        "item": `https://clinkaeng.com/${locale}/projects/${project.id}`
      }
    ]
  };

  return (
    <div className="container max-w-4xl py-10 mx-auto px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProjectDetailPanel project={project} loading={false} />
    </div>
  );
}
