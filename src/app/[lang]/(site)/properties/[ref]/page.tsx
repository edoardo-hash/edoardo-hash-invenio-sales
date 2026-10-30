import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findByRef, publicListings } from "@/lib/data";
import { eur, isLicensed, matchRequest } from "@/lib/rules";
import { fmt, href, isLang, type Lang } from "@/lib/i18n";
import { getDict, translateText } from "@/lib/i18n/translate";
import { FEATURE_GROUPS, FEATURES, featureText } from "@/lib/features";
import { DbNotice, ListingCard, listingTitle, SiteFooter, SiteHeader } from "@/components/site";
import { submitEnquiry } from "@/app/actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ lang: string; ref: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;
const L = (s: string): Lang => (isLang(s) ? s : "en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Ref. ${decodeURIComponent(ref)}` };
}

const Tick = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 7.5l3 3 7-7" fill="none" stroke="#0E6B62" strokeWidth="1.6" /></svg>
);
const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="6" width="9" height="6.5" rx="1" fill="none" stroke="#5C6662" strokeWidth="1.2" /><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" fill="none" stroke="#5C6662" strokeWidth="1.2" /></svg>
);

export default async function Property({ params, searchParams }: { params: Params; searchParams: SP }) {
  const p = await params;
  const lang = L(p.lang);
  const sp = await searchParams;
  const [t, res] = await Promise.all([getDict(lang), publicListings()]);
  const P = t.property;
  if (!res.ok) {
    return (
      <>
        <SiteHeader t={t} lang={lang} current="properties" />
        <main className="wrap section"><DbNotice reason={res.reason} t={t} /></main>
        <SiteFooter t={t} lang={lang} />
      </>
    );
  }
  const l = await findByRef(res.data, p.ref);
  if (!l) notFound();
  const summary = await translateText(lang, l.publicSummary);
  const hidePrice = sp.noprice === "1" || l.priceOnRequest || l.askingPrice === null;
  const similar = matchRequest(
    { budgetMin: null, budgetMax: (l.askingPrice ?? 0) * 1.4 || null, areas: [l.area, l.district], minBedrooms: Math.max(1, l.bedrooms - 1), mustHaves: [], licenceNeeded: false },
    res.data.filter((x) => x.uuid !== l.uuid),
  ).slice(0, 3).map((m) => m.listing);
  const photos = l.photos.slice(0, 5);
  const licensed = isLicensed(l.licence);
  const title = listingTitle(t, l);
  const status = l.status === "under_offer" ? P.underOffer : P.forSale;
  // Yes only: a buyer sees what the home has, never a list of "no".
  const featureGroups = FEATURE_GROUPS.map((g) => ({
    g,
    items: FEATURES.filter((f) => f.group === g && l.saleFeatures.has(f.key)).map((f) => featureText(t.mustHave, f.key, l.saleFeatures.get(f.key) ?? null)),
  })).filter((x) => x.items.length);
  const km = (n: number | null | undefined) => (n === null || n === undefined ? null : fmt(P.km, { n: n < 10 ? n.toFixed(1) : Math.round(n) }));
  const distances = l.road
    ? ([
        [P.distBeach, l.road.beach?.name ?? null, km(l.road.beach?.km)],
        [P.distVillage, l.road.village?.name ?? null, km(l.road.village?.km)],
        [P.distTown, null, km(l.road.town)],
        [P.distAirport, null, km(l.road.airport)],
      ] as [string, string | null, string | null][]).filter((d) => d[2])
    : [];
  const facts: [string | number, string][] = [
    [l.legalBedrooms ?? l.bedrooms, P.bedrooms],
    [l.bathrooms, P.bathrooms],
    [l.builtM2 ? `${Math.round(l.builtM2).toLocaleString("en-GB")} m²` : "—", P.built],
    [l.plotM2 ? `${Math.round(l.plotM2).toLocaleString("en-GB")} m²` : "—", P.plot],
  ];

  return (
    <>
      <SiteHeader t={t} lang={lang} current="properties" />
      <main>
        <div className="wrap">
          <nav className="crumbs" aria-label={P.breadcrumb}><Link href={href(lang, "/")}>{t.nav.sales}</Link> / <Link href={href(lang, "/properties")}>{t.nav.properties}</Link> / <span>Ref. {l.ref}</span></nav>
          <div className="gallery">
            {photos.map((ph, i) => (
              <figure key={ph}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph} alt={fmt(P.photoAlt, { title, n: i + 1 })} loading={i ? "lazy" : "eager"} />
                {i === photos.length - 1 && l.photos.length > photos.length ? <span className="more">{fmt(P.morePhotos, { n: l.photos.length })}</span> : null}
              </figure>
            ))}
          </div>
        </div>

        <section className="section" style={{ paddingTop: 56 }}>
          <div className="wrap vlayout">
            <div>
              <div className="stack" style={{ gap: 12 }}>
                <p className="eb">{status} · Ref. {l.ref}</p>
                <h1 style={{ fontSize: "clamp(40px,5vw,72px)", lineHeight: 1.04 }}>{title}</h1>
                <p className="lead" style={{ fontSize: 16 }}>{l.area}{l.district && l.district !== l.area ? `, ${l.district}` : ""} · {P.locationLine}</p>
              </div>
              <div className="facts">{facts.map(([v, k]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}</div>
              <div className="vsec">
                {summary ? (
                  summary.split(/\n{2,}/).map((para, i) => <p key={i} className="lead" style={{ color: i ? undefined : "var(--ink)", fontSize: i ? 17 : 18, maxWidth: "64ch" }}>{para}</p>)
                ) : (
                  <p className="lead ph">{P.noText}</p>
                )}
              </div>

              {featureGroups.length ? (
                <div className="vsec">
                  <h2>{P.featuresTitle}</h2>
                  <p className="lead" style={{ fontSize: 15 }}>{P.featuresLead}</p>
                  <div className="feat-groups">
                    {featureGroups.map(({ g, items }) => (
                      <div key={g}>
                        <p className="lab">{t.featureGroups[g]}</p>
                        <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="vsec">
                <h2>{P.checkedTitle}</h2>
                <p className="lead" style={{ fontSize: 15 }}>{P.checkedLead}</p>
                <ul className="list">{[P.checked1, P.checked2, P.checked3, P.checked4, P.checked5, P.checked6].map((x) => <li key={x}><Tick />{x}</li>)}</ul>
              </div>

              <div className="vsec">
                <h2>{P.sharedTitle}</h2>
                <p className="lead" style={{ fontSize: 15 }}>{P.sharedLead}</p>
                <ul className="list">{[P.shared1, P.shared2, P.shared3, P.shared4, P.shared5, P.shared6].map((x) => <li key={x}><Lock />{x}</li>)}</ul>
              </div>

              <div className="vsec">
                <h2>{P.goodToKnow}</h2>
                <div className="terms">
                  <div><b>{P.reference}</b><span>{l.ref}</span></div>
                  <div><b>{P.touristLicence}</b><span>{licensed ? (l.licenceTransferable ? P.licenceTransferable : P.yes) : P.noLicence}</span></div>
                  <div><b>{P.rented}</b><span>{l.rentableWhileOnSale === null ? P.askUs : l.rentableWhileOnSale ? P.rentedYes : P.no}</span></div>
                  <div><b>{P.viewings}</b><span>{P.viewingsText}</span></div>
                  <div><b>{P.cadastral}</b><span>{P.afterRegistration}</span></div>
                  <div><b>{P.signing}</b><span>{P.signingText}</span></div>
                </div>
              </div>

              <div className="vsec">
                <h2>{P.location}</h2>
                {distances.length ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <p className="lab">{P.distancesTitle}</p>
                    <div className="dist">
                      {distances.map(([k, name, v]) => (
                        <div key={k}><p className="small">{k}{name ? ` · ${name}` : ""}</p><p className="v">{v}</p></div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="areamap">
                  <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${l.area}, Ibiza`}>
                    <path d="M0 230 C110 205 160 150 250 160 C330 168 370 120 460 128 C550 136 600 98 690 106 C740 112 780 88 800 80 L800 350 L0 350Z" fill="#F4F3EE" stroke="#DEDCD3" />
                    <circle cx="400" cy="210" r="72" fill="#0E6B62" opacity=".12" />
                    <circle cx="400" cy="210" r="72" fill="none" stroke="#0E6B62" strokeDasharray="4 5" opacity=".6" />
                    <text x="400" y="214" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" fill="#0E6B62" letterSpacing="2">{l.area.toUpperCase()}</text>
                  </svg>
                  <p>{P.areaOnly}</p>
                </div>
              </div>
            </div>

            <aside className="panel-aside" aria-label={fmt(P.askAbout, { ref: l.ref })}>
              <div>
                <p className="small">{fmt(hidePrice ? P.priceLabel : P.askingPrice, { ref: l.ref })}</p>
                <p className="price">{hidePrice ? P.onRequest : eur(l.askingPrice)}</p>
              </div>
              <div className="prow"><span>{P.status}</span><span style={{ color: "var(--accent)", fontWeight: 500 }}>{status}</span></div>
              <div className="prow"><span>{P.bedrooms}</span><span>{l.legalBedrooms ?? l.bedrooms}</span></div>
              <div className="prow"><span>{P.bathrooms}</span><span>{l.bathrooms}</span></div>
              <div className="prow"><span>{P.touristLicence}</span><span>{licensed ? P.yes : P.no}</span></div>
              <form id="enquire" action={submitEnquiry} className="stack" style={{ gap: 12, borderTop: "1px solid var(--hair)", paddingTop: 16 }}>
                {sp.error ? <p className="note-err" role="alert">{t.brief.error}</p> : null}
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="ref" value={l.ref} />
                <input type="hidden" name="uuid" value={l.uuid} />
                <div className="field"><label htmlFor="e-name">{t.brief.name}</label><input id="e-name" name="name" autoComplete="name" required /></div>
                <div className="field"><label htmlFor="e-email">{t.brief.email}</label><input id="e-email" name="email" type="email" autoComplete="email" /></div>
                <div className="field"><label htmlFor="e-phone">{t.brief.phone}</label><input id="e-phone" name="phone" type="tel" autoComplete="tel" /></div>
                <button className="btn solid" type="submit" name="what" value="details" style={{ width: "100%" }}>{P.request}</button>
                <button className="btn ghost" type="submit" name="what" value="viewing" style={{ width: "100%" }}>{P.viewing}</button>
                <p className="small" style={{ textAlign: "center", lineHeight: 1.5 }}>{P.registerNote}</p>
              </form>
              <div className="inline" style={{ gap: 14, borderTop: "1px solid var(--hair)", paddingTop: 18 }}>
                <div className="mono" aria-hidden="true">DR</div>
                <div><p style={{ fontSize: 15, fontWeight: 500 }}>David Ramiro</p><p className="small">{t.home.headOfSales} · <a href="mailto:david@inveniohomes.com" style={{ color: "var(--accent)" }}>{P.emailDavid}</a></p></div>
              </div>
            </aside>
          </div>
        </section>

        {similar.length ? (
          <section className="section hair-top">
            <div className="wrap">
              <div className="head"><div className="stack"><p className="eb">{P.alsoLike}</p><h2 className="h2">{P.similar}</h2></div><Link className="lnk" href={href(lang, "/properties")}>{t.home.allProperties}</Link></div>
              <div className="grid3">{similar.map((s) => <ListingCard key={s.uuid} t={t} lang={lang} l={s} />)}</div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
