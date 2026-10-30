import Link from "next/link";
import { href, isLang, type Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/translate";
import { SiteFooter, SiteHeader } from "@/components/site";

export const dynamic = "force-dynamic";
const L = (s: string): Lang => (isLang(s) ? s : "en");

export default async function Thanks({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const lang = L((await params).lang);
  const sp = await searchParams;
  const t = await getDict(lang);
  const T = t.thanks;
  const [h, p] = sp.offline
    ? [T.offlineTitle, T.offlineText]
    : sp.kind === "enquiry"
      ? [T.enquiryTitle, T.enquiryText]
      : sp.kind === "valuation"
        ? [T.valuationTitle, T.valuationText]
        : [T.briefTitle, T.briefText];
  return (
    <>
      <SiteHeader t={t} lang={lang} />
      <main className="wrap section stack" style={{ maxWidth: 820 }}>
        <p className="eb">{t.home.eyebrow}</p>
        <h1 style={{ fontSize: "clamp(36px,4vw,56px)", lineHeight: 1.1 }}>{h}</h1>
        <p className="lead">{p}</p>
        <div className="actions"><Link className="btn solid" href={href(lang, "/properties")}>{T.back}</Link><Link className="lnk" href={href(lang, "/")}>{T.home}</Link></div>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
