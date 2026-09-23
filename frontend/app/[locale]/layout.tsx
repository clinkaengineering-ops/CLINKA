import type { Metadata } from "next";
import { Barlow, Cairo } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { GlobalUploadIndicator } from "@/components/UI/GlobalUploadIndicator";

const brandLatin = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-brand-latin",
});

const brandArabic = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-brand-arabic",
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
  icons: {
    icon: "/brand/mark.svg",
    apple: "/brand/mark.png",
  },
  metadataBase: new URL("https://clinkaeng.com"),
};

export default async function RootLayout(props: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { children } = props;
  const params = await props.params;
  const { locale } = params;

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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="clinka-theme",t=localStorage.getItem(k),d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();
            (function(){if(typeof Node==="function"&&Node.prototype){var originalInsertBefore=Node.prototype.insertBefore;Node.prototype.insertBefore=function(newNode,referenceNode){if(referenceNode&&referenceNode.parentNode!==this){return newNode;}return originalInsertBefore.call(this,newNode,referenceNode);};var originalRemoveChild=Node.prototype.removeChild;Node.prototype.removeChild=function(child){if(child&&child.parentNode!==this){return child;}return originalRemoveChild.call(this,child);};}})();`,
          }}
        />
      </head>
      <body>
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
