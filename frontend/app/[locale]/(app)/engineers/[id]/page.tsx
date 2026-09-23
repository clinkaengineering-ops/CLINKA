import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EngineerProfilePage } from "@/features/engineers/components/EngineerProfilePage";
import type { Engineer } from "@/types";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

async function getEngineer(id: string): Promise<Engineer | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";
  try {
    // using fetch instead of axios for Next.js SSR caching
    const res = await fetch(`${baseUrl}/users/engineers/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const engineer = await getEngineer(params.id);

  if (!engineer) {
    return { title: "Engineer Not Found" };
  }

  const { locale } = params;
  const name = engineer.name || "Engineer";
  const specialty = engineer.profile?.specialty || "Professional";
  const bio = engineer.profile?.bio || `Hire ${name} for your next engineering project on CLINKA.`;
  const desc = bio.slice(0, 155) + (bio.length > 155 ? "..." : "");

  return {
    title: `${name} — ${specialty} Engineer | CLINKA`,
    description: desc,
    alternates: {
      canonical: `https://clinka.com/${locale}/engineers/${engineer.id}`,
      languages: {
        en: `https://clinka.com/en/engineers/${engineer.id}`,
        ar: `https://clinka.com/ar/engineers/${engineer.id}`,
        "x-default": `https://clinka.com/en/engineers/${engineer.id}`,
      },
    },
    openGraph: {
      title: `${name} — ${specialty}`,
      description: desc,
      url: `https://clinka.com/${locale}/engineers/${engineer.id}`,
      images: engineer.avatarUrl ? [{ url: engineer.avatarUrl }] : undefined,
      type: "profile",
    },
  };
}

export default async function Page(props: Props) {
  const params = await props.params;
  const engineer = await getEngineer(params.id);

  if (!engineer) {
    notFound();
  }
  
  const { locale } = params;
  
  // Calculate average rating if review array exists
  let ratingValue = 5;
  let reviewCount = 1; // Fallback so schema is valid if no reviews
  // Assume engineer.reviews exists or can be aggregated, we use placeholders if missing
  // Since we don't have the exact structure of reviews in the Engineer type, we'll gracefully omit AggregateRating if 0
  
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: engineer.name || "Engineer",
    jobTitle: engineer.profile?.specialty || "Engineer",
    url: `https://clinka.com/${locale}/engineers/${engineer.id}`,
  };

  if (engineer.avatarUrl) {
    jsonLd.image = engineer.avatarUrl;
  }
  
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Engineers",
        "item": `https://clinka.com/${locale}/engineers`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": engineer.name || "Engineer",
        "item": `https://clinka.com/${locale}/engineers/${engineer.id}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <EngineerProfilePage id={engineer.id} />
    </>
  );
}