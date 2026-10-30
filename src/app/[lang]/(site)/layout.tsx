import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";

/** Only en (rewritten from the plain URLs), es, it and nl exist. */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return children;
}
