import type { Metadata } from "next";
import { Barlow, Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { I18nProvider } from "@/i18n";
import { AuthProvider } from "@/features/auth/components/AuthProvider";

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
    url: "https://clinka.com",
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
  metadataBase: new URL("https://clinka.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${brandLatin.variable} ${brandArabic.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="clinka-theme",t=localStorage.getItem(k),d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
