import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/en/", "/ar/"],
      disallow: [
        "/admin/",
        "/en/admin/",
        "/ar/admin/",
        "/dashboard/",
        "/en/dashboard/",
        "/ar/dashboard/",
        "/settings/",
        "/en/settings/",
        "/ar/settings/",
        "/messages/",
        "/en/messages/",
        "/ar/messages/",
        "/checkout/",
        "/en/checkout/",
        "/ar/checkout/",
        "/my-bids/",
        "/en/my-bids/",
        "/ar/my-bids/",
        "/my-projects/",
        "/en/my-projects/",
        "/ar/my-projects/",
        "/balance/",
        "/en/balance/",
        "/ar/balance/",
        "/escrow/",
        "/en/escrow/",
        "/ar/escrow/",
        "/invitations/",
        "/en/invitations/",
        "/ar/invitations/",
      ],
    },
    sitemap: "https://clinkaeng.com/sitemap.xml",
  };
}
