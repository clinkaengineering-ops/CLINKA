import type { Metadata } from "next";
import { Barlow, Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";
import { I18nProvider } from "@/i18n";

const brandLatin = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-brand-latin",
});

const brandArabic = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-brand-arabic",
});

export const metadata: Metadata = {
  title: "CLINKA",
  description: "CLINKA — Civil Link Architecture",
  icons: {
    icon: "/brand/mark.svg",
    apple: "/brand/mark.png",
  },
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
          <I18nProvider>{children}</I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
