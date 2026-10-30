import Link from "next/link";
import { headers } from "next/headers";
import type { Listing } from "@/lib/data";
import type { Dict } from "@/lib/i18n/en";
import { fmt, href, LANG_NAMES, LANGS, type Lang } from "@/lib/i18n";
import { eur } from "@/lib/rules";

export async function SiteHeader({ t, lang, current }: { t: Dict; lang: Lang; current?: "properties" | "sell" }) {
  const path = (await headers()).get("x-path") || "/";
  const links = (
    <>
      <Link href={href(lang, "/properties")} aria-current={current === "properties" ? "page" : undefined}>{t.nav.properties}</Link>
      <Link href={href(lang, "/sell")} aria-current={current === "sell" ? "page" : undefined}>{t.nav.sell}</Link>
      <a href="https://inveniohomes.com">{t.nav.rentals}</a>
      <a href={`${href(lang, "/")}#about`}>{t.nav.about}</a>
    </>
  );
  const langs = LANGS.map((l) => (
    <a key={l} href={href(l, path)} hrefLang={l} lang={l} aria-current={l === lang ? "true" : undefined} title={LANG_NAMES[l]}>{l.toUpperCase()}</a>
  ));
  return (
    <header className="site-head">
      <div className="wrap">
        <Link className="brand" href={href(lang, "/")} aria-label={t.nav.homeAria}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/invenio-logo.svg" alt="Invenio Homes" />
          <span>{t.nav.sales}</span>
        </Link>
        <nav className="site-nav" aria-label="Main">{links}</nav>
        <div className="head-cta">
          <nav aria-label={t.nav.language} className="langs">{langs}</nav>
          {/* A plain link, so the jump to the form on another page always scrolls. */}
          <a className="btn solid" href={`${href(lang, "/properties")}#brief`}>{t.nav.sendBrief}</a>
          {/* Phones (design critique, 30 Oct 2026): the links and languages go into one menu, no script needed. */}
          <details className="mmenu">
            <summary aria-label={t.nav.menu}>
              <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true"><path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" /></svg>
            </summary>
            <div className="mmenu-panel">
              <nav aria-label="Main">{links}</nav>
              <nav aria-label={t.nav.language} className="langs">{langs}</nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ t, lang }: { t: Dict; lang: Lang }) {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/invenio-logo.svg" alt="Invenio Homes" />
          <div className="foot-cols">
            <div><b>{t.footer.sales}</b><Link href={href(lang, "/properties")}>{t.nav.properties}</Link><Link href={href(lang, "/sell")}>{t.nav.sell}</Link><a href={`${href(lang, "/properties")}#brief`}>{t.nav.sendBrief}</a></div>
            <div><b>{t.footer.company}</b><a href="https://inveniohomes.com">{t.footer.villaRentals}</a><Link href="/portal">{t.nav.agentSignIn}</Link></div>
            <div><b>{t.footer.contact}</b><a href="mailto:david@inveniohomes.com">david@inveniohomes.com</a><a href="https://wa.me/34671349592">{fmt(t.footer.whatsapp, { phone: "+34 671 349 592" })}</a><span>Ibiza · Formentera</span></div>
          </div>
        </div>
        <div className="foot-bottom"><span>© 2026 Invenio Homes SL · {t.footer.register}</span><span>{t.footer.legal}</span></div>
      </div>
    </footer>
  );
}

export const Arrow = () => (
  <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true"><path d="M0 5h13M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg>
);

/** Sales cards show the reference and the area, never the villa's name. */
export const listingTitle = (t: Dict, l: Listing) => (l.bedrooms ? fmt(t.card.titleBeds, { beds: l.bedrooms, area: l.area }) : fmt(t.card.title, { area: l.area }));

export function ListingCard({ t, lang, l, as: H = "h3" }: { t: Dict; lang: Lang; l: Listing; as?: "h2" | "h3" }) {
  const under = l.status === "under_offer";
  return (
    <article className={`card${under ? " dim" : ""}`}>
      {under ? <span className="badge">{t.card.underOffer}</span> : null}
      <div className="img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {l.photos[0] ? <img src={l.photos[0]} alt={listingTitle(t, l)} loading="lazy" /> : null}
      </div>
      <div className="cb">
        <p className="meta">{fmt(t.card.meta, { ref: l.ref, beds: l.bedrooms, baths: l.bathrooms })}</p>
        <H className="name">{listingTitle(t, l)}</H>
        <p className="price">{l.priceOnRequest || l.askingPrice === null ? t.card.priceOnRequest : eur(l.askingPrice)}</p>
        <Link className="lnk" href={href(lang, `/properties/${encodeURIComponent(l.ref)}`)} style={{ marginTop: 10 }}>{t.card.view} <Arrow /></Link>
      </div>
    </article>
  );
}

/** Public pages: a plain message (the portal shows the technical one). */
export function DbNotice({ reason, message, t }: { reason: "no-db" | "error"; message?: string; t?: Dict }) {
  if (t) return <p className="notice">{reason === "no-db" ? t.db.missing : t.db.error}</p>;
  return (
    <p className="notice">
      {reason === "no-db"
        ? "The database is not connected to this deployment yet. Connect the portal's Neon database to this Vercel project and redeploy."
        : `Could not load from the database${message ? `: ${message}` : "."}`}
    </p>
  );
}
