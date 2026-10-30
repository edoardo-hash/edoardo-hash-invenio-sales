import type { Metadata } from "next";
import Link from "next/link";
import { href, isLang, type Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/translate";
import { SiteFooter, SiteHeader } from "@/components/site";
import { submitValuation } from "@/app/actions";

export const dynamic = "force-dynamic";
type Params = Promise<{ lang: string }>;
const L = (s: string): Lang => (isLang(s) ? s : "en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getDict(L((await params).lang));
  return { title: t.sell.eyebrow };
}

export default async function Sell({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | undefined>> }) {
  const lang = L((await params).lang);
  const sp = await searchParams;
  const t = await getDict(lang);
  const S = t.sell;
  return (
    <>
      <SiteHeader t={t} lang={lang} current="sell" />
      <main>
        <section className="hero" style={{ ["--hero-h" as string]: "560px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/owners-can-nemo-dining.jpg" alt={t.home.ownersAlt} />
          <div className="shade" aria-hidden="true" />
          <div className="wrap inner">
            <div className="content">
              <p className="eb">{S.eyebrow}</p>
              <h1 style={{ fontSize: "clamp(40px,4.8vw,68px)", lineHeight: 1.05 }}>{S.title}</h1>
              <div className="actions"><Link className="btn solid" href="#valuation">{S.valuationCta}</Link><Link className="lnk" href="#how">{S.howCta}</Link></div>
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="wrap">
            <div className="stack" style={{ maxWidth: 720, marginBottom: 48 }}>
              <p className="eb">{S.howEyebrow}</p>
              <h2 className="h2">{S.howTitle}</h2>
            </div>
            <div className="pillars">
              <div className="pillar"><span className="n">01</span><h3>{S.p1Title}</h3><p>{S.p1Text}</p></div>
              <div className="pillar"><span className="n">02</span><h3>{S.p2Title}</h3><p>{S.p2Text}</p></div>
              <div className="pillar"><span className="n">03</span><h3>{S.p3Title}</h3><p>{S.p3Text}</p></div>
              <div className="pillar"><span className="n">04</span><h3>{S.p4Title}</h3><p>{S.p4Text}</p></div>
            </div>
          </div>
        </section>

        <section className="section band">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">{S.exposureEyebrow}</p>
              <h2 className="h2">{S.exposureTitle}</h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(244,243,238,.72)" }}>{S.exposureLead}</p>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {[[S.exp1, S.exp1Note], [S.exp2, S.exp2Note], [S.exp3, S.exp3Note], [S.exp4, S.exp4Note]].map(([a, b]) => (
                <li key={a} style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "18px 0", borderTop: "1px solid rgba(244,243,238,.2)" }}>
                  <span style={{ fontSize: 18 }}>{a}</span><span style={{ fontSize: 14, color: "rgba(244,243,238,.66)", textAlign: "right" }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="stack" style={{ maxWidth: 720, marginBottom: 40 }}>
              <p className="eb">{S.docsEyebrow}</p>
              <h2 className="h2">{S.docsTitle}</h2>
              <p className="lead">{S.docsLead}</p>
            </div>
            <ul className="ticks">
              {[S.doc1, S.doc2, S.doc3, S.doc4, S.doc5, S.doc6, S.doc7, S.doc8, S.doc9, S.doc10, S.doc11, S.doc12].map((x) => <li key={x}>{x}</li>)}
            </ul>
          </div>
        </section>

        <section className="section hair-top">
          <div className="wrap split">
            <div className="stack"><p className="eb">{S.faqEyebrow}</p><h2 className="h2">{S.faqTitle}</h2></div>
            <div className="faq" style={{ borderTop: "1px solid var(--hair)" }}>
              <details open><summary>{S.q1}</summary><p>{S.a1}</p></details>
              <details><summary>{S.q2}</summary><p>{S.a2}</p></details>
              <details><summary>{S.q3}</summary><p>{S.a3}</p></details>
              <details><summary>{S.q4}</summary><p>{S.a4}</p></details>
            </div>
          </div>
        </section>

        <section id="valuation" className="section hair-top">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">{S.valuationEyebrow}</p>
              <h2 className="h2">{S.valuationTitle}</h2>
              <p className="lead">{S.valuationLead}</p>
            </div>
            <form action={submitValuation} aria-label={S.valuationAria} className="formbox">
              <input type="hidden" name="lang" value={lang} />
              {sp.error ? <p className="note-err" role="alert">{t.brief.error}</p> : null}
              <div className="cols">
                <div className="field"><label htmlFor="v-name">{t.brief.name}</label><input id="v-name" name="name" autoComplete="name" required /></div>
                <div className="field"><label htmlFor="v-email">{t.brief.email}</label><input id="v-email" name="email" type="email" autoComplete="email" /></div>
                <div className="field"><label htmlFor="v-phone">{t.brief.phone}</label><input id="v-phone" name="phone" type="tel" autoComplete="tel" /></div>
                <div className="field"><label htmlFor="v-area">{t.search.area}</label><input id="v-area" name="area" placeholder={S.areaExample} /></div>
                <div className="field"><label htmlFor="v-beds">{t.search.bedrooms}</label><select id="v-beds" name="beds"><option>3</option><option>4</option><option>5</option><option>6</option><option>7+</option></select></div>
                <div className="field"><label htmlFor="v-rent">{S.rentedWithUs}</label><select id="v-rent" name="rented"><option value="yes">{t.property.yes}</option><option value="no">{t.property.no}</option></select></div>
              </div>
              <div className="field"><label htmlFor="v-msg">{S.anythingToKnow}</label><textarea id="v-msg" name="message" /></div>
              <button className="btn solid" type="submit" style={{ alignSelf: "flex-end" }}>{S.valuationCta}</button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
