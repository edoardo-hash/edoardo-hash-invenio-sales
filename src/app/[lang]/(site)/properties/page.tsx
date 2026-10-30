import type { Metadata } from "next";
import Link from "next/link";
import { publicListings } from "@/lib/data";
import { isLicensed, MUST_HAVES } from "@/lib/rules";
import { fmt, href, isLang, type Lang } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n/en";
import { getDict } from "@/lib/i18n/translate";
import { DbNotice, ListingCard, SiteFooter, SiteHeader } from "@/components/site";
import { BriefForm } from "@/components/brief-form";

export const dynamic = "force-dynamic";

type Params = Promise<{ lang: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const L = (s: string): Lang => (isLang(s) ? s : "en");

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getDict(L((await params).lang));
  return { title: t.list.title };
}

export default async function Properties({ params, searchParams }: { params: Params; searchParams: SP }) {
  const lang = L((await params).lang);
  const sp = await searchParams;
  const [t, res] = await Promise.all([getDict(lang), publicListings()]);
  const all = res.ok ? res.data : [];
  const areas = [...new Set(all.map((l) => l.area))].sort();
  const area = one(sp.area);
  const [lo, hi] = one(sp.price).split("-").map((x) => (x ? Number(x) * 1e6 : null));
  const beds = Number(one(sp.beds)) || 0;
  const licence = one(sp.licence) === "1";
  const must = MUST_HAVES.filter((m) => m.key !== "licence" && one(sp[`m_${m.key}`]) === "on");
  const sort = one(sp.sort) || "price";
  const mh = (k: string) => t.mustHave[k as keyof Dict["mustHave"]] ?? k;

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
      <SiteHeader t={t} lang={lang} current="properties" />
      <main>
        <section className="wrap stack" style={{ paddingTop: 72, paddingBottom: 40 }}>
          <p className="eb">{t.list.eyebrow}</p>
          <h1 style={{ fontSize: "clamp(40px,4.6vw,64px)", lineHeight: 1.06 }}>{t.list.title}</h1>
          <div className="inline" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: "16px 32px" }}>
            <p className="lead">{res.ok ? `${fmt(t.list.count, { shown: list.length, total: all.length })} ` : ""}{t.list.addresses}</p>
            <Link className="btn ghost" href="#brief">{t.list.saveSearch}</Link>
          </div>
        </section>

        <section className="wrap">
          <form aria-label={t.list.filterAria} className="stack" style={{ gap: 18, borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)", padding: "24px 0" }}>
            <div className="cols">
              <div className="field">
                <label htmlFor="f-area">{t.search.area}</label>
                <select id="f-area" name="area" defaultValue={area}>
                  <option value="">{t.search.anywhere}</option>
                  {areas.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-price">{t.search.budget}</label>
                <select id="f-price" name="price" defaultValue={one(sp.price)}>
                  <option value="">{t.search.anyPrice}</option><option value="0-5">{t.search.upTo5}</option><option value="5-10">{t.search.from5to10}</option><option value="10-">{t.search.over10}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-beds">{t.search.bedrooms}</label>
                <select id="f-beds" name="beds" defaultValue={one(sp.beds)}>
                  <option value="">{t.search.any}</option><option value="4">4+</option><option value="5">5+</option><option value="6">6+</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="f-sort">{t.list.sortBy}</label>
                <select id="f-sort" name="sort" defaultValue={sort}>
                  <option value="price">{t.list.priceLow}</option><option value="price-desc">{t.list.priceHigh}</option><option value="new">{t.list.newest}</option>
                </select>
              </div>
            </div>
            <fieldset className="chips">
              <legend className="lab" style={{ marginBottom: 10 }}>{t.list.mustHaves}</legend>
              <label className="chip"><input type="checkbox" name="licence" value="1" defaultChecked={licence} /> {mh("licence")}</label>
              {MUST_HAVES.filter((m) => m.key !== "licence").map((m) => (
                <label key={m.key} className="chip"><input type="checkbox" name={`m_${m.key}`} defaultChecked={must.includes(m)} /> {mh(m.key)}</label>
              ))}
            </fieldset>
            <div className="inline"><button className="btn solid" type="submit">{t.list.show}</button><Link className="lnk" href={href(lang, "/properties")}>{t.list.clear}</Link></div>
          </form>
        </section>

        <section className="wrap" style={{ paddingTop: 40, paddingBottom: "var(--sec)" }}>
          {!res.ok ? <DbNotice reason={res.reason} t={t} /> : list.length ? (
            <div className="grid3">{list.map((l) => <ListingCard key={l.uuid} t={t} lang={lang} l={l} as="h2" />)}</div>
          ) : (
            <p className="lead">{t.list.nothing}</p>
          )}
        </section>

        <section id="brief" className="section hair-top">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">{t.brief.eyebrow}</p>
              <h2 className="h2">{t.brief.title}</h2>
              <p className="lead">{t.brief.lead}</p>
            </div>
            <BriefForm t={t} lang={lang} error={one(sp.error) === "brief"} />
          </div>
        </section>
      </main>
      <SiteFooter t={t} lang={lang} />
    </>
  );
}
