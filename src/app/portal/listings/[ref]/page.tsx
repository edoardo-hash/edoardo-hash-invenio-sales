import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { activities, allListings, clause7State, docProgress, findByRef, listRequests, sentVillas } from "@/lib/data";
import { day, eur, isLicensed, OFFER_TOTAL, PUBLISH_KEYS, requestStatusLabel, saleStatus } from "@/lib/rules";
import { isPortalAdmin, PageHead, PortalShell, VillaNames } from "@/components/portal";
import { FEATURE_GROUPS, FEATURES, featureText, GROUP_LABELS, FEATURE_LABELS } from "@/lib/features";
import { DbNotice } from "@/components/site";

export const dynamic = "force-dynamic";
type Params = Promise<{ ref: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `Portal · ${decodeURIComponent((await params).ref)}` };
}

const yn = (b: boolean | null) => (b === null ? "—" : b ? "Yes" : "No");

export default async function ListingPage({ params, searchParams }: { params: Params; searchParams: Promise<Record<string, string | undefined>> }) {
  const { ref } = await params;
  const sp = await searchParams;
  const res = await allListings();
  if (!res.ok) return <PortalShell current="sale"><PageHead title={decodeURIComponent(ref)} /><DbNotice reason={res.reason} message={res.message} /></PortalShell>;
  const l = await findByRef(res.data, ref);
  if (!l) notFound();

  const [docs, sent, acts, reqs, admin] = await Promise.all([docProgress([l.uuid]), sentVillas({ uuid: l.uuid }), activities({ uuid: l.uuid }), listRequests(), isPortalAdmin()]);
  const d = docs.get(l.uuid);
  const st = saleStatus(l.status);
  const reqById = new Map((reqs.ok ? reqs.data : []).map((r) => [r.id, r]));
  const villaActs = acts.ok ? acts.data : [];
  const reqIds = [...new Set([...(sent.ok ? sent.data.map((s) => s.requestId) : []), ...villaActs.filter((a) => a.requestId).map((a) => a.requestId as number)])];
  const onVilla = reqIds.map((id) => ({ r: reqById.get(id), s: sent.ok ? sent.data.find((x) => x.requestId === id) : undefined, c7: clause7State(villaActs.filter((a) => a.requestId === id), l.uuid) })).filter((x) => x.r);
  const confirmed = onVilla.filter((x) => x.c7.owner === "confirmed");

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;
  const shareUrl = `${origin}/properties/${encodeURIComponent(l.ref)}${sp.noprice === "1" ? "?noprice=1" : ""}`;
  const live = l.status === "approved" || l.status === "under_offer";

  return (
    <PortalShell current="sale">
      <nav className="small" aria-label="Breadcrumb"><Link href="/portal">For sale</Link> / {l.ref}</nav>
      <PageHead
        eyebrow={`${l.area} · ${l.legalBedrooms ?? l.bedrooms} bedrooms, ${l.bathrooms} baths`}
        title={<span className="inline" style={{ gap: 14 }}>{l.ref} <span className={`st ${st.tone}`}>{st.label}</span></span>}
        intro={<><VillaNames admin={admin} invenioName={l.invenioName} realName={l.realName} />{l.approvedBy ? `Approved by ${l.approvedBy}` : "Not approved yet"}</>}
        actions={<>{live ? <Link className="btn" href={`/properties/${encodeURIComponent(l.ref)}`}>View on website</Link> : null}<a className="btn solid" href={`https://ihtest.invenio.tools/villa/${l.uuid}/edit?tab=sale`}>Edit in the portal</a></>}
      />

      <div className="inline" style={{ alignItems: "flex-start", gap: 24 }}>
        <div className="stack" style={{ flex: "999 1 520px", minWidth: 0, gap: 24 }}>
          <section className="panel" aria-labelledby="sale-h">
            <div className="ph2"><h2 id="sale-h">Sale</h2><span className="small">Edited on the villa&apos;s Sale tab in the portal</span></div>
            <div className="pb">
              <div className="kv"><span>Asking price</span><span>{l.priceOnRequest ? "Price on request" : eur(l.askingPrice)}</span></div>
              <div className="kv"><span>Commission</span><span>{l.commissionPct !== null ? `${l.commissionPct}%` : "—"}</span></div>
              <div className="kv"><span>Negotiable</span><span>{yn(l.negotiable)}</span></div>
              <div className="kv"><span>Mandate</span><span>{l.mandateType === "exclusive" ? "Exclusive" : l.mandateType === "non_exclusive" ? "Non-exclusive" : l.mandateType === "none" ? "Not signed yet" : "—"}{l.mandateEndsOn ? ` · ends ${day(l.mandateEndsOn)}` : ""}</span></div>
              <div className="kv"><span>Listing partner</span><span>{l.listingPartner ?? "—"}</span></div>
              <div className="kv"><span>Exclusive agent elsewhere</span><span>{l.exclusiveAgent ?? "—"}</span></div>
              <div className="kv"><span>Built / plot</span><span>{l.builtM2 ? `${l.builtM2} m²` : "—"} / {l.plotM2 ? `${l.plotM2} m²` : "—"}</span></div>
              <div className="kv"><span>Cadastral reference</span><span>{l.cadastralRef ?? "—"}</span></div>
              <div className="kv"><span>Tourist licence</span><span>{isLicensed(l.licence) ? `${l.licence}${l.licenceTransferable ? " · transferable" : ""}` : "None"}</span></div>
              <div className="kv"><span>Exposure</span><span>{[l.offMarket && "Off-market", l.websiteOnly && "Website only", l.rentableWhileOnSale && "Rentable while on sale"].filter(Boolean).join(" · ") || "Website and portals"}</span></div>
              {l.notes ? <div className="kv"><span>Staff notes</span><span style={{ textAlign: "right", maxWidth: "60ch" }}>{l.notes}</span></div> : null}
            </div>
          </section>

          <section className="panel" aria-labelledby="ft-h">
            <div className="ph2"><h2 id="ft-h">Features</h2><span className="small">{l.saleFeatures.size ? `${l.saleFeatures.size} ticked · edited on the Sale tab` : "None yet · the HAM or sales fill them on the Sale tab"}</span></div>
            <div className="pb">
              {FEATURE_GROUPS.map((g) => {
                const items = FEATURES.filter((f) => f.group === g && l.saleFeatures.has(f.key));
                return items.length ? (
                  <div key={g} className="kv"><span>{GROUP_LABELS[g]}</span><span style={{ textAlign: "right", maxWidth: "60ch" }}>{items.map((f) => featureText(FEATURE_LABELS, f.key, l.saleFeatures.get(f.key) ?? null)).join(" · ")}</span></div>
                ) : null;
              })}
              {l.road ? (
                <div className="kv"><span>By road</span><span>{[
                  l.road.beach && `${l.road.beach.name ?? "beach"} ${l.road.beach.km} km`,
                  l.road.village && `${l.road.village.name ?? "village"} ${l.road.village.km} km`,
                  l.road.town !== null && `Ibiza Town ${l.road.town} km`,
                  l.road.airport !== null && `airport ${l.road.airport} km`,
                ].filter(Boolean).join(" · ")}</span></div>
              ) : null}
            </div>
          </section>

          <section className="panel" aria-labelledby="dd-h">
            <div className="ph2"><h2 id="dd-h">Due diligence</h2></div>
            <div className="pb cols" style={{ paddingTop: 16 }}>
              <div className="stack" style={{ gap: 8 }}><div className="inline" style={{ justifyContent: "space-between" }}><span>Before publishing</span><b style={{ fontWeight: 500 }}>{d?.publish ?? 0} / {PUBLISH_KEYS.length}</b></div><div className="bar" style={{ width: "100%" }}><span style={{ width: `${((d?.publish ?? 0) / PUBLISH_KEYS.length) * 100}%` }} /></div></div>
              <div className="stack" style={{ gap: 8 }}><div className="inline" style={{ justifyContent: "space-between" }}><span>Before an offer</span><b style={{ fontWeight: 500 }}>{d?.offer ?? 0} / {OFFER_TOTAL}</b></div><div className="bar" style={{ width: "100%" }}><span style={{ width: `${((d?.offer ?? 0) / OFFER_TOTAL) * 100}%` }} /></div></div>
            </div>
            <p className="small" style={{ padding: "0 22px 18px" }}>Key documents: nota simple {d?.byKey.get("nota_simple") ?? "missing"} · title deed {d?.byKey.get("escritura") ?? "missing"} · signed mandate {d?.byKey.get("mandate") ?? "missing"}.</p>
          </section>
        </div>

        <div className="stack" style={{ flex: "1 1 340px", minWidth: 0, gap: 24 }}>
          <section className="panel" aria-labelledby="sh-h">
            <div className="ph2"><h2 id="sh-h">Share with a buyer</h2><span className="new">New</span></div>
            <div className="pb stack" style={{ gap: 12, paddingTop: 16 }}>
              {!live ? <p className="small">Only approved listings can be shared.</p> : (
                <>
                  <p className="small" style={{ lineHeight: 1.5 }}>Send the full page only to buyers the owner has confirmed. The price shown is always the mandate price.</p>
                  <p className="small">Owner-confirmed buyers: {confirmed.length ? confirmed.map((x) => x.r!.contactName).join(", ") : "none yet"}</p>
                  <div className="field"><label htmlFor="link">Link</label><input id="link" readOnly value={shareUrl} /></div>
                  <div className="inline">
                    <Link className="btn sm" href={sp.noprice === "1" ? "?" : "?noprice=1"}>{sp.noprice === "1" ? "Show the price" : "Hide the price"}</Link>
                    <a className="btn sm solid" href={`mailto:?subject=${encodeURIComponent(`Ref. ${l.ref} · ${l.area}`)}&body=${encodeURIComponent(shareUrl)}`}>Send by email</a>
                    <button className="btn sm" type="button" disabled title="Coming later">White-label</button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="panel" aria-labelledby="rq-h">
            <div className="ph2"><h2 id="rq-h">Buyer requests</h2><span className="small">{onVilla.length} on this villa</span></div>
            <div className="pb">
              {onVilla.length ? onVilla.map(({ r, s, c7 }) => (
                <Link key={r!.id} href={`/portal/requests/${r!.id}`} className="item">
                  <span><b style={{ fontWeight: 500, display: "block" }}>{r!.contactName}</b><span className="small">{requestStatusLabel(r!.status)}{s ? ` · ${s.state}` : ""}</span></span>
                  <span className={`st ${c7.owner === "confirmed" ? "ok" : c7.owner === "asked" ? "warn" : "neu"}`}>{c7.owner === "confirmed" ? "Owner confirmed" : c7.owner === "asked" ? "Waiting for owner" : "Not registered"}</span>
                </Link>
              )) : <p className="small" style={{ padding: "12px 0" }}>No buyer requests on this villa yet.</p>}
            </div>
          </section>

          <section className="panel" aria-labelledby="ac-h">
            <div className="ph2"><h2 id="ac-h">Activity</h2></div>
            <ol className="pb" style={{ listStyle: "none", margin: 0 }}>
              {villaActs.length ? villaActs.slice(0, 12).map((a) => (
                <li key={a.id} className="kv" style={{ flexDirection: "column", gap: 2 }}><span style={{ color: "var(--ink)" }}>{a.body}</span><span className="small">{day(a.happenedOn)} · {a.author}</span></li>
              )) : <li className="small" style={{ padding: "12px 0" }}>Nothing logged yet.</li>}
            </ol>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
