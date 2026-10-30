import Link from "next/link";
import type { Listing } from "@/lib/data";
import { eur } from "@/lib/rules";

export function SiteHeader({ current }: { current?: "properties" | "sell" }) {
  return (
    <header className="site-head">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Invenio Homes sales home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/invenio-logo.svg" alt="Invenio Homes" />
          <span>Sales</span>
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/properties" aria-current={current === "properties" ? "page" : undefined}>Properties for sale</Link>
          <Link href="/sell" aria-current={current === "sell" ? "page" : undefined}>Sell with us</Link>
          <a href="https://inveniohomes.com">Rentals</a>
          <Link href="/#about">About us</Link>
        </nav>
        <div className="head-cta">
          <Link className="signin" href="/portal">Agent sign in</Link>
          <Link className="btn solid" href="/properties#brief">Send your brief</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/invenio-logo.svg" alt="Invenio Homes" />
          <div className="foot-cols">
            <div><b>Sales</b><Link href="/properties">Properties for sale</Link><Link href="/sell">Sell with us</Link><Link href="/properties#brief">Send your brief</Link></div>
            <div><b>Invenio Homes</b><a href="https://inveniohomes.com">Villa rentals</a><Link href="/portal">Agent sign in</Link></div>
            <div><b>Contact</b><a href="mailto:david@inveniohomes.com">david@inveniohomes.com</a><a href="https://wa.me/34671349592">+34 671 349 592</a><span>Ibiza · Formentera</span></div>
          </div>
        </div>
        <div className="foot-bottom"><span>© 2026 Invenio Homes SL · Balearic agents register GOIBE766172/2024</span><span>Privacy · Terms · Cookies</span></div>
      </div>
    </footer>
  );
}

export const Arrow = () => (
  <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg>
);

/** Sales cards show the reference and the area, never the villa's name. */
export const listingTitle = (l: Listing) => `${l.bedrooms ? `${l.bedrooms}-bedroom villa` : "Villa"} in ${l.area}`;

export function ListingCard({ l, as: H = "h3" }: { l: Listing; as?: "h2" | "h3" }) {
  const under = l.status === "under_offer";
  return (
    <article className={`card${under ? " dim" : ""}`}>
      {under ? <span className="badge">Under offer</span> : null}
      <div className="img">
        {l.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.photos[0]} alt={listingTitle(l)} loading="lazy" />
        ) : null}
      </div>
      <div className="cb">
        <p className="meta">Ref. {l.ref} · {l.bedrooms} bedrooms, {l.bathrooms} baths</p>
        <H className="name">{listingTitle(l)}</H>
        <p className="price">{l.priceOnRequest || l.askingPrice === null ? "Price on request" : eur(l.askingPrice)}</p>
        <Link className="lnk" href={`/properties/${encodeURIComponent(l.ref)}`} style={{ marginTop: 10 }}>View property <Arrow /></Link>
      </div>
    </article>
  );
}

export function DbNotice({ reason, message }: { reason: "no-db" | "error"; message?: string }) {
  return (
    <p className="notice">
      {reason === "no-db"
        ? "The database is not connected to this deployment yet, so listings can't be shown. Connect the portal's Neon database to this Vercel project and redeploy."
        : `Listings could not be loaded from the database${message ? `: ${message}` : "."}`}
    </p>
  );
}
