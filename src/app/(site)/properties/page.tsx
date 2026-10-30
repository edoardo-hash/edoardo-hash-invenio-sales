import type { Metadata } from "next";
import Link from "next/link";
import { publicListings } from "@/lib/data";
import { isLicensed, MUST_HAVES } from "@/lib/rules";
import { DbNotice, ListingCard, SiteFooter, SiteHeader } from "@/components/site";
import { BriefForm } from "@/components/brief-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Properties for sale" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Properties({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const res = await publicListings();
  const all = res.ok ? res.data : [];
  const areas = [...new Set(all.map((l) => l.area))].sort();
  const area = one(sp.area);
  const [lo, hi] = one(sp.price).split("-").map((x) => (x ? Number(x) * 1e6 : null));
  const beds = Number(one(sp.beds)) || 0;
  const licence = one(sp.licence) === "1";
  const must = MUST_HAVES.filter((m) => one(sp[`m_${m.key}`]) === "on");
  const sort = one(sp.sort) || "price";

  let list = all.filter(
    (l) =>
      (!area || l.area === area) &&
      (!beds || (l.legalBedrooms ?? l.bedrooms) >= beds) &&
      (!licence || isLicensed(l.licence)) &&
      (lo === null || lo === undefined || (l.askingPrice ?? Infinity) >= lo) &&
      (hi === null || hi === undefined || (l.askingPrice ?? 0) <= hi) &&
      must.every((m) => m.match(l)),
  );
  if (sort === "price-desc") list = [...list].sort((a, b) => (b.askingPrice ?? 0) - (a.askingPrice ?? 0));
  else if (sort === "new") list = [...list].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

  return (
    <>
      <SiteHeader current="properties" />
      <main>
        <section className="wrap stack" style={{ paddingTop: 72, paddingBottom: 40 }}>
          <p className="eb">Properties for sale</p>
          <h1 style={{ fontSize: "clamp(40px,4.6vw,64px)", lineHeight: 1.06 }}>Villas for sale in Ibiza</h1>
          <div className="inline" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "16px 32px" }}>
            <p className="lead">
              {res.ok ? `${list.length} of ${all.length} homes shown.` : ""} Addresses and documents are shared once the owner has confirmed your registration.
            </p>
            <Link className="btn ghost" href="#brief">Save this search as a brief</Link>
          </div>
        </section>

        <section className="wrap">
          <form aria-label="Filter properties" className="stack" style={{ gap: 18, borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)", padding: "24px 0" }}>
            <div className="cols">
              <div className="field">
                <label htmlFor="f-area">Area</label>
                <select id="f-area" name="area" defaultValue={area}>
                  <option value="">Anywhere in Ibiza</option>
                  {areas.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-price">Budget</label>
                <select id="f-price" name="price" defaultValue={one(sp.price)}>
                  <option value="">Any price</option><option value="0-5">Up to €5M</option><option value="5-10">€5M to €10M</option><option value="10-">Over €10M</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-beds">Bedrooms</label>
                <select id="f-beds" name="beds" defaultValue={one(sp.beds)}>
                  <option value="">Any</option><option value="4">4+</option><option value="5">5+</option><option value="6">6+</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-sort">Sort by</label>
                <select id="f-sort" name="sort" defaultValue={sort}>
                  <option value="price">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="new">Newest first</option>
                </select>
              </div>
            </div>
            <fieldset className="chips">
              <legend className="lab" style={{ marginBottom: 10 }}>Must-haves</legend>
              <label className="chip"><input type="checkbox" name="licence" value="1" defaultChecked={licence} /> Tourist licence</label>
              {MUST_HAVES.filter((m) => m.key !== "licence").map((m) => (
                <label key={m.key} className="chip"><input type="checkbox" name={`m_${m.key}`} defaultChecked={must.includes(m)} /> {m.label}</label>
              ))}
            </fieldset>
            <div className="inline"><button className="btn solid" type="submit">Show results</button><Link className="lnk" href="/properties">Clear</Link></div>
          </form>
        </section>

        <section className="wrap" style={{ paddingTop: 40, paddingBottom: "var(--sec)" }}>
          {!res.ok ? <DbNotice reason={res.reason} message={res.message} /> : list.length ? (
            <div className="grid3">{list.map((l) => <ListingCard key={l.uuid} l={l} as="h2" />)}</div>
          ) : (
            <p className="lead">Nothing matches these filters. Send us your brief below: some homes are only shown privately.</p>
          )}
        </section>

        <section id="brief" className="section hair-top">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">Buyer brief</p>
              <h2 className="h2">Tell us what you are looking for</h2>
              <p className="lead">We match your brief against every listing, including homes owners only show privately. Before we share an address or documents, we register you with that owner, as our sale mandates require.</p>
            </div>
            <BriefForm error={one(sp.error) === "brief"} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
