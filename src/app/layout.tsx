import type { Metadata } from "next";
import { headers } from "next/headers";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { isLang } from "@/lib/i18n";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin", "latin-ext"], weight: ["300", "400", "500", "600"], variable: "--hanken", display: "swap" });
/** Portal headings only (design "The vein", 31 Oct 2026); the public website stays Hanken Grotesk. */
const news = Newsreader({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--news", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Invenio Homes Sales", template: "%s · Invenio Homes Sales" },
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = isLang(h.get("x-lang")) ? h.get("x-lang")! : "en";
  return (
    <html lang={lang} className={`${hanken.variable} ${news.variable}`}>
      <body>{children}</body>
    </html>
  );
}
