import type { Metadata } from "next";
import Link from "next/link";
import { publicListings } from "@/lib/data";
import { href, isLang, type Lang } from "@/lib/i18n";
import { getDict } from "@/lib/i18n/translate";
import { Arrow, DbNotice, ListingCard, SiteFooter, SiteHeader } from "@/components/site";

export const dynamic = "force-dynamic";
type Params = Promise<{ lang: string }>;
const L = (s: string): Lang => (isLang(s) ? s : "en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getDict(L((await params).lang));
  return { title: { absolute: `Invenio Homes · ${t.meta.title}` }, description: t.meta.description };
}

export default async function Home({ params }: { params: Params }) {
  const lang = L((await params).lang);
  const [t, res] = await Promise.all([getDict(lang), publicListings()]);
  const featured = res.ok ? res.data.filter((l) => l.status === "approved").slice(0, 3) : [];
  const areas = res.ok ? [...new Set(res.data.map((l) => l.area))].sort() : [];
  const h = t.home;

  return (
    <>
      <SiteHeader t={t} lang={lang} />
      <main>
        <section className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-living-sea-view.jpg" alt={h.heroAlt} fetchPriority="high" />
          <div className="shade" aria-hidden="true" />
          <div className="wrap inner">
            <div className="content">
              <p className="eb">{h.eyebrow}</p>
              <h1 className="h1">{h.title}</h1>
              <p className="lead">{h.lead}</p>
              <div className="actions">
                <Link className="btn solid" href={href(lang, "/properties")}>{h.seeProperties}</Link>
                <Link className="lnk" href={href(lang, "/sell")}>{h.sellingCta}</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap">
          <form action={href(lang, "/properties")} aria-label={t.search.aria} className="cols" style={{ background: "var(--card)", border: "1px solid var(--hair)", padding: "22px 24px" }}>
            <div className="field">
              <label htmlFor="h-area">{t.search.area}</label>
              <select id="h-area" name="area" defaultValue="">
                <option value="">{t.search.anywhere}</option>
                {areas.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-price">{t.search.budget}</label>
              <select id="h-price" name="price" defaultValue="">
                <option value="">{t.search.anyPrice}</option><option value="0-5">{t.search.upTo5}</option><option value="5-10">{t.search.from5to10}</option><option value="10-">{t.search.over10}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-beds">{t.search.bedrooms}</label>
              <select id="h-beds" name="beds" defaultValue="">
                <option value="">{t.search.any}</option><option value="4">4+</option><option value="5">5+</option><option value="6">6+</option>
              </select>
            </div>
            <button className="btn solid" type="submit" style={{ width: "100%" }}>{t.search.go}</button>
          </form>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="head">
              <div className="stack">
                <p className="eb">{h.forSaleNow}</p>
                <h2 className="h2">{h.checkedTitle}</h2>
                <p className="lead">{h.checkedLead}</p>
              </div>
              <Link className="lnk" href={href(lang, "/properties")}>{h.allProperties} <Arrow /></Link>
            </div>
            {!res.ok ? <DbNotice reason={res.reason} t={t} /> : featured.length ? (
              <div className="grid3">{featured.map((l) => <ListingCard key={l.uuid} t={t} lang={lang} l={l} />)}</div>
            ) : (
              <p className="lead">{h.noneYet}</p>
            )}
          </div>
        </section>

        <section className="hair-top" style={{ padding: "clamp(64px,7vw,96px) 0" }}>
          <div className="wrap split">
            <div className="stack" style={{ gap: 0 }}>
              <p className="eb" style={{ marginBottom: 18 }}>{h.collections}</p>
              <Link className="rowlink" href={`${href(lang, "/properties")}?licence=1`}><span className="stack" style={{ gap: 4 }}><span className="t">{h.licenceTitle}</span><span className="meta">{h.licenceText}</span></span><Arrow /></Link>
              <Link className="rowlink" href={`${href(lang, "/properties")}?sort=new`}><span className="stack" style={{ gap: 4 }}><span className="t">{h.newestTitle}</span><span className="meta">{h.newestText}</span></span><Arrow /></Link>
              <Link className="rowlink" href={`${href(lang, "/properties")}#brief`} style={{ borderBottom: "1px solid var(--hair)" }}><span className="stack" style={{ gap: 4 }}><span className="t">{h.offMarketTitle}</span><span className="meta">{h.offMarketText}</span></span><Arrow /></Link>
            </div>
            <div className="stack">
              <p className="eb">{h.browseByArea}</p>
              <nav aria-label={h.browseByArea} className="inline" style={{ gap: 10 }}>
                {areas.length ? areas.map((a) => <Link key={a} className="btn ghost" href={`${href(lang, "/properties")}?area=${encodeURIComponent(a)}`}>{a}</Link>) : <span className="meta">{h.areasLater}</span>}
              </nav>
            </div>
          </div>
        </section>

        <section className="section band">
          <div className="wrap stack" style={{ gap: 40 }}>
            <div className="stack" style={{ maxWidth: 720 }}>
              <p className="eb">{h.howEyebrow}</p>
              <h2 className="h2">{h.howTitle}</h2>
            </div>
            <ol className="steps">
              <li><span className="n">01</span><h3>{h.step1Title}</h3><p>{h.step1Text}</p></li>
              <li><span className="n">02</span><h3>{h.step2Title}</h3><p>{h.step2Text}</p></li>
              <li><span className="n">03</span><h3>{h.step3Title}</h3><p>{h.step3Text}</p></li>
              <li><span className="n">04</span><h3>{h.step4Title}</h3><p>{h.step4Text}</p></li>
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap split" style={{ alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/owners-can-nemo-dining.jpg" alt={h.ownersAlt} style={{ width: "100%", aspectRatio: "5/4", objectFit: "cover" }} loading="lazy" />
            <div className="stack" style={{ gap: 20 }}>
              <p className="eb">{h.ownersEyebrow}</p>
              <h2 className="h2">{h.ownersTitle}</h2>
              <p className="lead" style={{ maxWidth: "46ch" }}>{h.ownersLead}</p>
              <Link className="btn ghost" href={href(lang, "/sell")} style={{ alignSelf: "flex-start" }}>{t.nav.sell}</Link>
            </div>
          </div>
        </section>

        <section id="about" className="section hair-top">
          <div className="wrap split" style={{ alignItems: "center" }}>
            <div className="inline" style={{ gap: 28 }}>
              <div className="mono" aria-hidden="true" style={{ width: 120, height: 120, fontSize: 40 }}>DR</div>
              <div className="stack" style={{ gap: 6 }}><p className="eb">{h.contactEyebrow}</p><h2 style={{ fontSize: 32 }}>David Ramiro</h2><p className="meta">{h.headOfSales}</p></div>
            </div>
            <div className="stack" style={{ gap: 20 }}>
              <p className="lead">{h.contactLead}</p>
              <div className="actions"><Link className="btn solid" href={`${href(lang, "/properties")}#brief`}>{t.nav.sendBrief}</Link><a className="lnk" href="mailto:david@inveniohomes.com">david@inveniohomes.com</a></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
