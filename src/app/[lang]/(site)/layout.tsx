import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import "@/app/globals.css";

/** Only en (rewritten from the plain URLs), es, it and nl exist. */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <link rel="preload" href="/assets/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
      <link rel="preload" href="/assets/fonts/jost-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
      <meta name="theme-color" content="#f6f1e7" />
      {children}
    </>
  );
}
