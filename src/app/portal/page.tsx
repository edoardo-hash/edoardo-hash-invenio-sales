import type { Metadata } from "next";
import Link from "next/link";
import { allListings, docProgress, listRequests, sheetOnly } from "@/lib/data";
import { eur, PUBLISH_KEYS, REQUEST_STATUSES } from "@/lib/rules";
import { isPortalAdmin, PageHead, PortalShell, VillaNames } from "@/components/portal";
import { DbNotice } from "@/components/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portal · For sale" };

/**
 * For sale — design "The vein" (Edo, 31 Oct 2026): one pipeline from the owner sheet to the notary, one tick per
 * property; each stage is a filter. Below it the listings (readiness = the 15 "before publishing" checklist items)
 * and the owner-sheet villas with no listing yet, grouped by what has to happen next.
 */
type Stage = "sheet" | "ok" | "draft" | "review" | "approved" | "under_offer" | "sold";
type Group = "W" | "UP" | "NC" | "OK";

const STAGES: { key: Stage; label: string; tick: string }[] = [
  { key: "sheet", label: "On sheet", tick: "#D6D3CC" },
  { key: "ok", label: "Contact OK", tick: "#A9A59C" },
  { key: "draft", label: "Draft", tick: "#2C2C2B" },
  { key: "review", label: "Awaiting David", tick: "#2C2C2B" },
  { key: "approved", label: "For sale", tick: "#8A6F3E" },
  { key: "under_offer", label: "Under offer", tick: "#8A6F3E" },
  { key: "sold", label: "Sold", tick: "#8A6F3E" },
];
const LISTING_LABEL: Record<string, string> = { draft: "Draft", review: "Awaiting David", approved: "For sale", under_offer: "Under offer", sold: "Sold", withdrawn: "Withdrawn" };
const LIVE = new Set(["approved", "under_offer", "sold"]);

/** The sheet's "Action" column → the next step. */
function groupOf(action: string | null): Group {
  const a = (action ?? "").toLowerCase();
  if (a.startsWith("ok")) return "OK";
  if (a.startsWith("update price")) return "UP";
  if (a.startsWith("not asked")) return "NC";
  return "W";
}
const GROUPS: { key: Group; label: string; hint: string; action: string }[] = [
  { key: "W", label: "Waiting on the HAM", hint: "The HAM has been asked about price and mandate and has not answered. Send one reminder per HAM, not per villa.", action: "Remind HAM" },
  { key: "UP", label: "Price to update", hint: "The owner gave a new price that is not on the sheet yet. Confirm it with the HAM, then update the sheet.", action: "Confirm price" },
  { key: "NC", label: "No HAM on file", hint: "Nobody has been asked about these. Assign a HAM first; until then they cannot move.", action: "Assign HAM" },
  { key: "OK", label: "Ready to list", hint: "The HAM confirmed price and that the owner wants to sell. Create the listing and it moves into Draft.", action: "Create listing" },
];

const ref = (uuid: string) => `V-${uuid.replace(/-/g, "").slice(0, 6)}`;
const mandate = (m: string | null) => (m === "exclusive" ? "Exclusive" : m === "non_exclusive" ? "Non-exclusive" : m === "none" ? "Not signed" : "Not set");

export default async function ForSale({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [res, sheetRes, reqs, admin] = await Promise.all([allListings(), sheetOnly(), listRequests(), isPortalAdmin()]);
  if (!res.ok) return <PortalShell current="sale"><PageHead eyebrow="" title="For sale" /><DbNotice reason={res.reason} message={res.message} /></PortalShell>;

  const listings = res.data;
  const docs = await docProgress(listings.map((l) => l.uuid));
  const sheet = (sheetRes.ok ? sheetRes.data : []).map((r) => ({ ...r, group: groupOf(r.action), priceN: r.price === null ? null : Number(r.price) }));
  const open = reqs.ok ? reqs.data.filter((r) => REQUEST_STATUSES.find((s) => s.key === r.status)?.open).length : 0;

  const stage = STAGES.some((s) => s.key === sp.stage) ? (sp.stage as Stage) : null;
  const group: Group = GROUPS.some((g) => g.key === sp.group) ? (sp.group as Group) : stage === "ok" ? "OK" : "W";

  const count = (k: Stage) =>
    k === "sheet" ? sheet.filter((r) => r.group !== "OK").length : k === "ok" ? sheet.filter((r) => r.group === "OK").length : listings.filter((l) => l.status === k).length;
  const live = listings.filter((l) => l.status === "approved").length;
  const listingStage = stage && stage !== "sheet" && stage !== "ok";
  const showListings = !stage || listingStage;
  const showSheet = !stage || stage === "sheet" || stage === "ok";
  const shown = listings.filter((l) => !listingStage || l.status === stage);

  // Links keep the other filter as the design does: "Contact OK" opens "Ready to list", "On sheet" the HAM groups.
  const stageHref = (k: Stage) => {
    if (stage === k) return "/portal";
    const g = k === "ok" ? "OK" : k === "sheet" ? "W" : null;
    return `/portal?stage=${k}${g ? `&group=${g}` : ""}`;
  };
  const groupHref = (g: Group) => {
    const st = g === "OK" ? "ok" : stage === "ok" ? "sheet" : stage;
    return `/portal?${st ? `stage=${st}&` : ""}group=${g}#sheet-h`;
  };

  const cur = GROUPS.find((g) => g.key === group)!;
  const rows = sheet.filter((r) => r.group === group).sort((a, b) => (b.priceN ?? -1) - (a.priceN ?? -1));

  // One email per HAM with all their villas in this group (the hint: one reminder per HAM, not per villa).
  const mail = (email: string | null, who: string | null) => {
    if (!email || (group !== "W" && group !== "UP")) return null;
    const theirs = rows.filter((r) => r.sales_contact_email === email);
    const first = (who ?? "").split(" ")[0];
    const lines = theirs.map((r) => `- ${ref(r.uuid)} · ${r.area ?? "?"}${admin && r.invenio_name ? ` · ${r.invenio_name}` : ""}${group === "UP" ? ` · sheet price ${eur(r.priceN)}` : ""}`).join("\n");
    const subject = group === "W" ? "Villas for sale – price and mandate" : "Villas for sale – new prices to confirm";
    const body =
      group === "W"
        ? `Hi ${first},\n\nThese villas are flagged for sale in "Villas for sale – status & price" and we are still waiting for your answer. For each one, could you confirm the asking price, that the owner still wants to sell, and the mandate (exclusive, non-exclusive or none)?\n\n${lines}\n\nThank you`
        : `Hi ${first},\n\nThe owners of these villas gave a new price that is not on the sheet yet. Could you confirm the new asking price for each one?\n\n${lines}\n\nThank you`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <PortalShell current="sale">
      <PageHead
        eyebrow=""
        title="For sale"
        intro="Every property flagged for sale, from the owner sheet to the notary. Listings go live for agents and on the website once David approves them."
        actions={<><Link className="btn" href="/portal/requests">Buyer requests{open ? ` · ${open} open` : ""}</Link><Link className="btn solid" href={`/portal?stage=ok&group=OK#sheet-h`}>New listing</Link></>}
      />

      <section aria-labelledby="pipe-h" className="stack" style={{ gap: 16 }}>
        <div className="inline" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 id="pipe-h" style={{ fontSize: 15, fontWeight: 600 }}>Pipeline</h2>
          <p className="small" style={{ fontSize: 14 }}>{sheet.length + listings.length} properties flagged for sale – {listings.length} listed, {live} live</p>
        </div>
        <nav aria-label="Pipeline stages" className={`pipe${stage ? " dim" : ""}`}>
          {STAGES.map((s) => {
            const n = count(s.key);
            return (
              <Link key={s.key} href={stageHref(s.key)} aria-current={stage === s.key ? "true" : undefined} aria-label={`${s.label}, ${n} ${n === 1 ? "property" : "properties"}`}
                style={{ flex: `${n} 1 ${n ? n * 5 : 64}px`, minWidth: n * 5 > 64 ? n * 5 : undefined }}>
                <span className="ticks" aria-hidden="true">
                  {n ? Array.from({ length: n }, (_, i) => <i key={i} style={{ background: s.tick }} />) : <span className="none" />}
                </span>
                <b className={s.key === "approved" && n ? "gold" : undefined}>{n}</b>
                <span className="lbl">{s.label}</span>
              </Link>
            );
          })}
        </nav>
        {stage ? <p><Link href="/portal" style={{ color: "var(--green)", textDecoration: "underline" }}>Show every stage</Link></p> : null}
      </section>

      {showListings ? (
        <section aria-labelledby="list-h" className="stack" style={{ gap: 14 }}>
          <div className="inline" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 id="list-h" className="serif">Listings</h2>
            <p className="small" style={{ fontSize: 14 }}>Readiness counts the {PUBLISH_KEYS.length} checklist items a listing needs before David can approve it.</p>
          </div>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead><tr><th scope="col">Reference</th><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>Beds</th><th scope="col" style={{ textAlign: "right" }}>Asking price</th><th scope="col">Stage</th><th scope="col">Readiness</th><th scope="col">Mandate</th></tr></thead>
              <tbody>
                {shown.map((l) => {
                  const gold = LIVE.has(l.status);
                  const p = docs.get(l.uuid)?.publish ?? 0;
                  return (
                    <tr key={l.uuid}>
                      <td>
                        <Link href={`/portal/listings/${encodeURIComponent(l.ref)}`} style={{ fontWeight: 600 }}>{l.ref}</Link>
                        <VillaNames admin={admin} invenioName={l.invenioName} realName={l.realName} />
                      </td>
                      <td>{l.area}</td>
                      <td style={{ textAlign: "right" }}>{l.legalBedrooms ?? l.bedrooms ?? "–"}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: gold ? 600 : 400 }} className={gold ? "gold" : undefined}>{l.priceOnRequest ? "On request" : eur(l.askingPrice)}</td>
                      <td><span className="inline" style={{ flexWrap: "nowrap" }}><span className={`dot${gold ? " gold" : ""}`} aria-hidden="true" />{LISTING_LABEL[l.status] ?? l.status}</span></td>
                      <td>
                        <span className="inline" style={{ gap: 10, flexWrap: "nowrap" }}>
                          <span className="segs" role="img" aria-label={`${p} of ${PUBLISH_KEYS.length} items complete`}>{PUBLISH_KEYS.map((k, i) => <i key={k} className={i < p ? "on" : undefined} />)}</span>
                          <span className="small" style={{ fontSize: 13 }}>{p} of {PUBLISH_KEYS.length}</span>
                        </span>
                      </td>
                      <td className="small">{mandate(l.mandateType)}</td>
                    </tr>
                  );
                })}
                {!shown.length ? <tr><td colSpan={7} className="small">No listing is at this stage yet. Pick another stage, or turn a property from the list below into a listing.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showSheet && sheet.length ? (
        <section aria-labelledby="sheet-h" className="stack" style={{ gap: 14 }}>
          <div className="stack" style={{ gap: 4 }}>
            <h2 id="sheet-h" className="serif">On the owner sheet, no listing yet</h2>
            <p className="small" style={{ fontSize: 14, maxWidth: 640 }}>Flagged for sale in &quot;Villas for sale – status &amp; price&quot;. Grouped by what has to happen next, so each group is one round of messages to the HAMs.</p>
          </div>
          <nav aria-label="Next step" className="pills">
            {GROUPS.map((g) => (
              <Link key={g.key} href={groupHref(g.key)} aria-current={g.key === group ? "true" : undefined}>
                {g.label} <span>{sheet.filter((r) => r.group === g.key).length}</span>
              </Link>
            ))}
          </nav>
          <p style={{ fontSize: 14 }}>{cur.hint}</p>
          <div className="panel" style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 720 }}>
              <thead><tr><th scope="col">Reference</th><th scope="col">Area</th><th scope="col" style={{ textAlign: "right" }}>Beds</th><th scope="col" style={{ textAlign: "right" }}>Sheet price</th><th scope="col">HAM</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const noHam = !r.sales_contact || r.sales_contact === "No contact";
                  const href = noHam ? null : mail(r.sales_contact_email, r.sales_contact);
                  return (
                    <tr key={r.uuid}>
                      <td><b style={{ fontWeight: 600 }}>{ref(r.uuid)}</b><VillaNames admin={admin} invenioName={r.invenio_name} realName={r.real_name} /></td>
                      <td>{r.area ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>{r.bedrooms ?? "–"}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }} className={r.priceN === null ? "small" : undefined}>
                        {r.priceN !== null ? eur(r.priceN) : (r.action ?? "").toLowerCase().includes("request") ? "On request" : "No price yet"}
                      </td>
                      <td style={{ color: noHam ? "var(--muted)" : "var(--ink-soft)" }}>{noHam ? "No HAM on file" : r.sales_contact}</td>
                      <td style={{ textAlign: "right" }}>
                        {href ? <a className="act" href={href}>{cur.action}</a> : <span className="act" title="Done in the portal for now">{cur.action}</span>}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length ? <tr><td colSpan={6} className="small">Nothing in this group.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </PortalShell>
  );
}
