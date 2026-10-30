import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--hanken", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Invenio Homes Sales — Villas for sale in Ibiza", template: "%s · Invenio Homes Sales" },
  description: "Villas for sale in Ibiza, checked before they are listed. Invenio Homes sales team.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hanken.variable}>
      <body>{children}</body>
    </html>
  );
}
