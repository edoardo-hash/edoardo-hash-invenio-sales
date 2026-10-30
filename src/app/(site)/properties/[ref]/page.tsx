import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findByRef, publicListings } from "@/lib/data";
import { eur, isLicensed, matchRequest } from "@/lib/rules";
import { DbNotice, ListingCard, listingTitle, SiteFooter, SiteHeader } from "@/components/site";
import { submitEnquiry } from "@/app/actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ ref: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

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
  const { ref } = await params;
  const sp = await searchParams;
  const res = await publicListings();
  if (!res.ok) {
    return (
      <>
        <SiteHeader current="properties" />
        <main className="wrap section"><DbNotice reason={res.reason} message={res.message} /></main>
        <SiteFooter />
      </>
    );
  }
  const l = await findByRef(res.data, ref);
  if (!l) notFound();
  const hidePrice = sp.noprice === "1" || l.priceOnRequest || l.askingPrice === null;
  const similar = matchRequest(
    { budgetMin: null, budgetMax: (l.askingPrice ?? 0) * 1.4 || null, areas: [l.area, l.district], minBedrooms: Math.max(1, l.bedrooms - 1), mustHaves: [], licenceNeeded: false },
    res.data.filter((x) => x.uuid !== l.uuid),
  ).slice(0, 3).map((m) => m.listing);
  const photos = l.photos.slice(0, 5);
  const licensed = isLicensed(l.licence);
  const facts: [string | number, string][] = [
    [l.legalBedrooms ?? l.bedrooms, "Bedrooms"],
    [l.bathrooms, "Bathrooms"],
    [l.builtM2 ? `${Math.round(l.builtM2).toLocaleString("en-GB")} m²` : "—", "Built"],
    [l.plotM2 ? `${Math.round(l.plotM2).toLocaleString("en-GB")} m²` : "—", "Plot"],
  ];

  return (
    <>
      <SiteHeader current="properties" />
      <main>
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Sales</Link> / <Link href="/properties">Properties for sale</Link> / <span>Ref. {l.ref}</span></nav>
          <div className="gallery">
            {photos.map((p, i) => (
              <figure key={p}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`${listingTitle(l)}, photo ${i + 1}`} loading={i ? "lazy" : "eager"} />
                {i === photos.length - 1 && l.photos.length > photos.length ? <span className="more">{l.photos.length} photos after registration</span> : null}
              </figure>
            ))}
          </div>
        </div>

        <section className="section" style={{ paddingTop: 56 }}>
          <div className="wrap vlayout">
            <div>
              <div className="stack" style={{ gap: 12 }}>
                <p className="eb">{l.status === "under_offer" ? "Under offer" : "For sale"} · Ref. {l.ref}</p>
                <h1 style={{ fontSize: "clamp(40px,5vw,72px)", lineHeight: 1.04 }}>{listingTitle(l)}</h1>
                <p className="lead" style={{ fontSize: 16 }}>{l.area}{l.district && l.district !== l.area ? `, ${l.district}` : ""} · exact location shared after registration</p>
              </div>
              <div className="facts">
                {facts.map(([v, k]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}
              </div>
              <div className="vsec">
                {l.publicSummary ? (
                  l.publicSummary.split(/\n{2,}/).map((p, i) => <p key={i} className="lead" style={{ color: i ? undefined : "var(--ink)", fontSize: i ? 17 : 18, maxWidth: "64ch" }}>{p}</p>)
                ) : (
                  <p className="lead ph">The sale text is being written by our sales team. Ask us for details in the meantime.</p>
                )}
              </div>

              <div className="vsec">
                <h2>Checked before listing</h2>
                <p className="lead" style={{ fontSize: 15 }}>Our sales team reviewed these before this villa went on sale.</p>
                <ul className="list">
                  {["Registry note (nota simple)", "Title deed (escritura)", "Legal and illegal works identified", "Charges, mortgages or liens", "Tourist licence status", "Signed sale mandate"].map((t) => <li key={t}><Tick />{t}</li>)}
                </ul>
              </div>

              <div className="vsec">
                <h2>Shared after registration</h2>
                <p className="lead" style={{ fontSize: 15 }}>Once the owner confirms you by email, these open on your private page.</p>
                <ul className="list">
                  {["Exact location and full gallery", "Planning certificate (certificado urbanístico)", "Habitability certificate (cédula)", "Approved architectural plans", "Rental income history and weekly rates", "Last IBI receipt and running costs"].map((t) => <li key={t}><Lock />{t}</li>)}
                </ul>
              </div>

              <div className="vsec">
                <h2>Good to know</h2>
                <div className="terms">
                  <div><b>Reference</b><span>{l.ref}</span></div>
                  <div><b>Tourist licence</b><span>{licensed ? (l.licenceTransferable ? "Yes, transferable" : "Yes") : "No tourist licence"}</span></div>
                  <div><b>Currently rented</b><span>{l.rentableWhileOnSale === null ? "Ask us" : l.rentableWhileOnSale ? "Yes, viewings planned around guests" : "No"}</span></div>
                  <div><b>Viewings</b><span>Confirmed with the owner by email</span></div>
                  <div><b>Cadastral reference</b><span>Shared after registration</span></div>
                  <div><b>Signing</b><span>Private contract (arras), then deed at the notary</span></div>
                </div>
              </div>

              <div className="vsec">
                <h2>Location</h2>
                <div className="areamap">
                  <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Area: ${l.area}, Ibiza`}>
                    <path d="M0 230 C110 205 160 150 250 160 C330 168 370 120 460 128 C550 136 600 98 690 106 C740 112 780 88 800 80 L800 350 L0 350Z" fill="#F4F3EE" stroke="#DEDCD3" />
                    <circle cx="400" cy="210" r="72" fill="#0E6B62" opacity=".12" />
                    <circle cx="400" cy="210" r="72" fill="none" stroke="#0E6B62" strokeDasharray="4 5" opacity=".6" />
                    <text x="400" y="214" textAnchor="middle" fontFamily="Hanken Grotesk, sans-serif" fontSize="13" fill="#0E6B62" letterSpacing="2">{l.area.toUpperCase()}</text>
                  </svg>
                  <p>Area shown only</p>
                </div>
              </div>
            </div>

            <aside className="panel-aside" aria-label={`Ask about Ref. ${l.ref}`}>
              <div>
                <p className="small">Ref. {l.ref} · {hidePrice ? "price" : "asking price"}</p>
                <p className="price">{hidePrice ? "On request" : eur(l.askingPrice)}</p>
              </div>
              <div className="prow"><span>Status</span><span style={{ color: "var(--accent)", fontWeight: 500 }}>{l.status === "under_offer" ? "Under offer" : "For sale"}</span></div>
              <div className="prow"><span>Bedrooms</span><span>{l.legalBedrooms ?? l.bedrooms}</span></div>
              <div className="prow"><span>Bathrooms</span><span>{l.bathrooms}</span></div>
              <div className="prow"><span>Tourist licence</span><span>{licensed ? "Yes" : "No"}</span></div>
              <form id="enquire" action={submitEnquiry} className="stack" style={{ gap: 12, borderTop: "1px solid var(--hair)", paddingTop: 16 }}>
                {sp.error ? <p className="note-err" role="alert">Please add your name and an email or phone number.</p> : null}
                <input type="hidden" name="ref" value={l.ref} />
                <input type="hidden" name="uuid" value={l.uuid} />
                <div className="field"><label htmlFor="e-name">Full name</label><input id="e-name" name="name" autoComplete="name" required /></div>
                <div className="field"><label htmlFor="e-email">Email</label><input id="e-email" name="email" type="email" autoComplete="email" /></div>
                <div className="field"><label htmlFor="e-phone">Phone</label><input id="e-phone" name="phone" type="tel" autoComplete="tel" /></div>
                <button className="btn solid" type="submit" name="what" value="details" style={{ width: "100%" }}>Request details</button>
                <button className="btn ghost" type="submit" name="what" value="viewing" style={{ width: "100%" }}>Arrange a viewing</button>
                <p className="small" style={{ textAlign: "center", lineHeight: 1.5 }}>We register you with the owner before sharing the address and documents.</p>
              </form>
              <div className="inline" style={{ gap: 14, borderTop: "1px solid var(--hair)", paddingTop: 18 }}>
                <div className="mono" aria-hidden="true">DR</div>
                <div><p style={{ fontSize: 15, fontWeight: 500 }}>David Ramiro</p><p className="small">Head of Sales · <a href="mailto:david@inveniohomes.com" style={{ color: "var(--accent)" }}>Email David</a></p></div>
              </div>
            </aside>
          </div>
        </section>

        {similar.length ? (
          <section className="section hair-top">
            <div className="wrap">
              <div className="head"><div className="stack"><p className="eb">You may also like</p><h2 className="h2">Similar homes for sale</h2></div><Link className="lnk" href="/properties">All properties for sale</Link></div>
              <div className="grid3">{similar.map((s) => <ListingCard key={s.uuid} l={s} />)}</div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
