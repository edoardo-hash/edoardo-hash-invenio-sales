import Link from "next/link";
import { publicListings } from "@/lib/data";
import { Arrow, DbNotice, ListingCard, SiteFooter, SiteHeader } from "@/components/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const res = await publicListings();
  const featured = res.ok ? res.data.filter((l) => l.status === "approved").slice(0, 3) : [];
  const areas = res.ok ? [...new Set(res.data.map((l) => l.area))].sort() : [];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-living-sea-view.jpg" alt="Living room opening onto a sea-view terrace, Ibiza" fetchPriority="high" />
          <div className="shade" aria-hidden="true" />
          <div className="wrap inner">
            <div className="content">
              <p className="eb">Invenio Homes · Sales</p>
              <h1 className="h1">Villas for sale in Ibiza, known from the inside</h1>
              <p className="lead">
                Most of the homes we sell are villas we already look after as rentals. We know the licence, the layout and the paperwork, and our sales
                team takes you from first viewing to the notary.
              </p>
              <div className="actions">
                <Link className="btn solid" href="/properties">See properties for sale</Link>
                <Link className="lnk" href="/sell">Selling a villa? Talk to us</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap">
          <form action="/properties" aria-label="Search properties for sale" className="cols" style={{ background: "var(--card)", border: "1px solid var(--hair)", padding: "22px 24px" }}>
            <div className="field">
              <label htmlFor="h-area">Area</label>
              <select id="h-area" name="area" defaultValue="">
                <option value="">Anywhere in Ibiza</option>
                {areas.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-price">Budget</label>
              <select id="h-price" name="price" defaultValue="">
                <option value="">Any price</option><option value="0-5">Up to €5M</option><option value="5-10">€5M to €10M</option><option value="10-">Over €10M</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-beds">Bedrooms</label>
              <select id="h-beds" name="beds" defaultValue="">
                <option value="">Any</option><option value="4">4+</option><option value="5">5+</option><option value="6">6+</option>
              </select>
            </div>
            <button className="btn solid" type="submit" style={{ width: "100%" }}>Search</button>
          </form>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="head">
              <div className="stack">
                <p className="eb">For sale now</p>
                <h2 className="h2">Checked before they reach this page</h2>
                <p className="lead">Every listing passes our document check first: registry note, title deed, tourist licence and any illegal works, identified before a buyer sees it.</p>
              </div>
              <Link className="lnk" href="/properties">All properties for sale <Arrow /></Link>
            </div>
            {!res.ok ? <DbNotice reason={res.reason} message={res.message} /> : featured.length ? (
              <div className="grid3">{featured.map((l) => <ListingCard key={l.uuid} l={l} />)}</div>
            ) : (
              <p className="lead">No approved listings yet. They appear here as soon as David approves them in the portal.</p>
            )}
          </div>
        </section>

        <section className="hair-top" style={{ padding: "clamp(64px,7vw,96px) 0" }}>
          <div className="wrap split">
            <div className="stack" style={{ gap: 0 }}>
              <p className="eb" style={{ marginBottom: 18 }}>Collections</p>
              <Link className="rowlink" href="/properties?licence=1"><span className="stack" style={{ gap: 4 }}><span className="t">Villas with a tourist licence</span><span className="meta">Buy to live and rent: licence checked before listing</span></span><Arrow /></Link>
              <Link className="rowlink" href="/properties?sort=new"><span className="stack" style={{ gap: 4 }}><span className="t">Newest listings</span><span className="meta">The latest homes our sales team approved</span></span><Arrow /></Link>
              <Link className="rowlink" href="/properties#brief" style={{ borderBottom: "1px solid var(--hair)" }}><span className="stack" style={{ gap: 4 }}><span className="t">Off-market</span><span className="meta">Shown privately to registered buyers</span></span><Arrow /></Link>
            </div>
            <div className="stack">
              <p className="eb">Browse by area</p>
              <nav aria-label="Areas" className="inline" style={{ gap: 10 }}>
                {areas.length ? areas.map((a) => <Link key={a} className="btn ghost" href={`/properties?area=${encodeURIComponent(a)}`}>{a}</Link>) : <span className="meta">Areas appear with the listings.</span>}
              </nav>
            </div>
          </div>
        </section>

        <section className="section band">
          <div className="wrap stack" style={{ gap: 40 }}>
            <div className="stack" style={{ maxWidth: 720 }}>
              <p className="eb">How buying works</p>
              <h2 className="h2">Four steps, every one in writing</h2>
            </div>
            <ol className="steps">
              <li><span className="n">01</span><h3>Send your brief</h3><p>Budget, areas, bedrooms and must-haves. We match it against every listing, including private ones.</p></li>
              <li><span className="n">02</span><h3>We register you with the owner</h3><p>The owner confirms you by email before we share the address and documents, as our sale mandates require.</p></li>
              <li><span className="n">03</span><h3>Viewings</h3><p>Each viewing is confirmed with the owner by email: date, time and who attends.</p></li>
              <li><span className="n">04</span><h3>Arras and deed</h3><p>We stay with you and your lawyer through the private contract and the signing at the notary.</p></li>
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap split" style={{ alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/owners-can-nemo-dining.jpg" alt="Dining terrace with a sea view" style={{ width: "100%", aspectRatio: "5/4", objectFit: "cover" }} loading="lazy" />
            <div className="stack" style={{ gap: 20 }}>
              <p className="eb">For owners</p>
              <h2 className="h2">Selling a villa we already know</h2>
              <p className="lead" style={{ maxWidth: "46ch" }}>If we manage your villa&apos;s rentals, we already hold most of what a buyer asks for. You choose an exclusive or open mandate, and whether the villa is on the portals or shown privately.</p>
              <Link className="btn ghost" href="/sell" style={{ alignSelf: "flex-start" }}>Sell with us</Link>
            </div>
          </div>
        </section>

        <section id="about" className="section hair-top">
          <div className="wrap split" style={{ alignItems: "center" }}>
            <div className="inline" style={{ gap: 28 }}>
              <div className="mono" aria-hidden="true" style={{ width: 120, height: 120, fontSize: 40 }}>DR</div>
              <div className="stack" style={{ gap: 6 }}><p className="eb">Your contact</p><h2 style={{ fontSize: 32 }}>David Ramiro</h2><p className="meta">Head of Sales, Invenio Homes</p></div>
            </div>
            <div className="stack" style={{ gap: 20 }}>
              <p className="lead">Tell us what you are looking for, including homes that are not on this page. Some owners only sell privately to registered buyers.</p>
              <div className="actions"><Link className="btn solid" href="/properties#brief">Send your brief</Link><a className="lnk" href="mailto:david@inveniohomes.com">david@inveniohomes.com</a></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
