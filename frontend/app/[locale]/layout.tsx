import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { GlobalUploadIndicator } from "@/components/UI/GlobalUploadIndicator";

const brandLatin = localFont({
  src: [
    { path: "../fonts/barlow-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/barlow-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/barlow-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/barlow-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/barlow-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/barlow-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-brand-latin",
  display: "swap",
});

const brandArabic = localFont({
  src: [
    { path: "../fonts/cairo-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/cairo-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cairo-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cairo-arabic-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cairo-arabic-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/cairo-arabic-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-brand-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | CLINKA — Engineering Marketplace",
    default: "CLINKA — The Premier Engineering & Architectural Marketplace",
  },
  description:
    "Hire top-tier freelance engineers, architects, and civil engineering experts. Manage projects, escrow payments, and collaborate seamlessly on CLINKA.",
  keywords: [
    "engineering marketplace",
    "freelance engineers",
    "hire engineers",
    "civil engineers",
    "mechanical engineers",
    "electrical engineers",
    "architectural engineers",
    "engineering freelancers",
    "engineering services",
    "engineering projects",
    "engineering platform",
    "engineering talent",
    "CAD designers",
    "structural engineers",
  ],
  authors: [{ name: "CLINKA" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clinkaeng.com",
    siteName: "CLINKA",
    title: "CLINKA — The Premier Engineering & Architectural Marketplace",
    description:
      "Hire top-tier freelance engineers, architects, and civil engineering experts. Manage projects, escrow payments, and collaborate seamlessly.",
    images: [
      {
        url: "/brand/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CLINKA Engineering Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CLINKA — The Premier Engineering & Architectural Marketplace",
    description:
      "Hire top-tier freelance engineers, architects, and civil engineering experts. Manage projects, escrow payments, and collaborate seamlessly.",
    images: ["/brand/twitter-card.jpg"],
    creator: "@clinka_hq",
  },
  metadataBase: new URL("https://clinkaeng.com"),
};

export default async function RootLayout(props: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { children } = props;
  const params = await props.params;
  const rawLocale = params.locale;
  const locale = (rawLocale === "en" || rawLocale === "ar") ? rawLocale : "en";

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CLINKA",
    url: "https://clinkaeng.com",
    logo: "https://clinkaeng.com/brand/mark.svg",
    sameAs: [
      "https://twitter.com/clinka_hq"
    ]
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CLINKA",
    url: "https://clinkaeng.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://clinkaeng.com/en/engineers?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning className={`${brandLatin.variable} ${brandArabic.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body>
        <Script
          id="clinka-theme-dom-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="clinka-theme",t=localStorage.getItem(k),d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();
            (function(){if(typeof Node==="function"&&Node.prototype){var originalInsertBefore=Node.prototype.insertBefore;Node.prototype.insertBefore=function(newNode,referenceNode){if(referenceNode&&referenceNode.parentNode!==this){return newNode;}return originalInsertBefore.call(this,newNode,referenceNode);};var originalRemoveChild=Node.prototype.removeChild;Node.prototype.removeChild=function(child){if(child&&child.parentNode!==this){return child;}return originalRemoveChild.call(this,child);};}})();`,
          }}
        />
        <ThemeProvider>
          <I18nProvider serverLocale={locale as "en" | "ar"}>
            <AuthProvider>
              {children}
              <GlobalUploadIndicator />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
