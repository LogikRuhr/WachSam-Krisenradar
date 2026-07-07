import type { Metadata, Viewport } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import "./globals.css";

const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "WachSam — Haushalts-Krisencheck",
  description:
    "Persönlicher Haushalts-Krisencheck für Deutschland: Was betrifft meinen Haushalt, was kostet es ungefähr pro Monat, und was kann ich konkret tun?",
};

export const viewport: Viewport = {
  themeColor: "#0D0D0D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans">
        <TopNav />
        {children}
        <FeedbackWidget />
        <Footer />
      </body>
    </html>
  );
}
