import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://clinkaeng.com";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api";

  let engineers: any[] = [];
  let projects: any[] = [];

  try {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      const engRes = await fetch(
        `${apiUrl}/users/engineers?page=${page}&limit=${pageSize}`,
      );
      if (!engRes.ok) break;
      const engJson = await engRes.json();
      const batch = engJson.data?.engineers || [];
      engineers = engineers.concat(batch);
      totalPages = Math.max(1, Number(engJson.data?.totalPages) || 1);
      if (batch.length === 0 || page >= 50) break;
      page += 1;
    }

    const projRes = await fetch(`${apiUrl}/projects`);
    if (projRes.ok) {
      const projJson = await projRes.json();
      projects = projJson.data || [];
    }
  } catch (error) {
    console.error("Failed to fetch data for sitemap:", error);
  }

  const staticPages = ["", "/about", "/help", "/privacy", "/security", "/terms", "/engineers", "/projects"];

  const routes: MetadataRoute.Sitemap = staticPages.flatMap((page) => {
    return [
      {
        url: `${baseUrl}/en${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${page}`,
            ar: `${baseUrl}/ar${page}`,
            "x-default": `${baseUrl}/en${page}`,
          },
        },
      },
      {
        url: `${baseUrl}/ar${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${page}`,
            ar: `${baseUrl}/ar${page}`,
            "x-default": `${baseUrl}/en${page}`,
          },
        },
      },
    ];
  });

  const engineerRoutes: MetadataRoute.Sitemap = engineers.flatMap((engineer) => {
    return [
      {
        url: `${baseUrl}/en/engineers/${engineer.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${baseUrl}/en/engineers/${engineer.id}`,
            ar: `${baseUrl}/ar/engineers/${engineer.id}`,
            "x-default": `${baseUrl}/en/engineers/${engineer.id}`,
          },
        },
      },
      {
        url: `${baseUrl}/ar/engineers/${engineer.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${baseUrl}/en/engineers/${engineer.id}`,
            ar: `${baseUrl}/ar/engineers/${engineer.id}`,
            "x-default": `${baseUrl}/en/engineers/${engineer.id}`,
          },
        },
      },
    ];
  });

  const projectRoutes: MetadataRoute.Sitemap = projects.flatMap((project) => {
    return [
      {
        url: `${baseUrl}/en/projects/${project.id}`,
        lastModified: new Date(project.updatedAt || new Date()),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en/projects/${project.id}`,
            ar: `${baseUrl}/ar/projects/${project.id}`,
            "x-default": `${baseUrl}/en/projects/${project.id}`,
          },
        },
      },
      {
        url: `${baseUrl}/ar/projects/${project.id}`,
        lastModified: new Date(project.updatedAt || new Date()),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: {
            en: `${baseUrl}/en/projects/${project.id}`,
            ar: `${baseUrl}/ar/projects/${project.id}`,
            "x-default": `${baseUrl}/en/projects/${project.id}`,
          },
        },
      },
    ];
  });

  return [...routes, ...engineerRoutes, ...projectRoutes];
}
