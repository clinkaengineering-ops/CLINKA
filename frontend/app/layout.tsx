import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeSync } from "@/components/theme";
import { I18nProvider } from "@/i18n";

const inter = Inter({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "CLINKA",
  description: "CLINKA frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeSync />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
