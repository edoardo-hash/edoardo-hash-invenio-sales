import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";
import { submitValuation } from "@/app/actions";

export const metadata: Metadata = { title: "Sell with us" };

export default async function Sell({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader current="sell" />
      <main>
        <section className="hero" style={{ ["--hero-h" as string]: "560px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/owners-can-nemo-dining.jpg" alt="Dining terrace with a sea view" />
          <div className="shade" aria-hidden="true" />
          <div className="wrap inner">
            <div className="content">
              <p className="eb">Sell with us</p>
              <h1 style={{ fontSize: "clamp(40px,4.8vw,68px)", lineHeight: 1.05 }}>Sell your villa with the team that already knows it</h1>
              <div className="actions"><Link className="btn solid" href="#valuation">Request a valuation</Link><Link className="lnk" href="#how">How it works</Link></div>
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="wrap">
            <div className="stack" style={{ maxWidth: 720, marginBottom: 48 }}>
              <p className="eb">How it works</p>
              <h2 className="h2">From valuation to the notary, every step agreed with you in writing</h2>
            </div>
            <div className="pillars">
              <div className="pillar"><span className="n">01</span><h3>Valuation and mandate</h3><p>We agree a marketing price and a mandate, exclusive or not. The price changes only with your written approval by email.</p></div>
              <div className="pillar"><span className="n">02</span><h3>Documents checked first</h3><p>Before we publish, we check the registry note, title deed, licences and any illegal works, so buyers&apos; lawyers find no surprises.</p></div>
              <div className="pillar"><span className="n">03</span><h3>You approve every buyer</h3><p>We email you each buyer&apos;s name and ID before we share anything. Nothing is sent until you confirm.</p></div>
              <div className="pillar"><span className="n">04</span><h3>Viewings, offer, signing</h3><p>Each viewing is confirmed with you by email. We stay with you and your lawyer through the arras and the deed.</p></div>
            </div>
          </div>
        </section>

        <section className="section band">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">Your choice of exposure</p>
              <h2 className="h2">Public, private or somewhere in between</h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: "rgba(244,243,238,.72)" }}>You decide how visible your villa is. You can also keep renting it while it is on sale.</p>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {[["On our website and the portals", "Widest reach"], ["On our website only", "No portals"], ["Off-market", "Registered buyers only"], ["Brochure on request", "PDF sent by us"]].map(([a, b]) => (
                <li key={a} style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "18px 0", borderTop: "1px solid rgba(244,243,238,.2)" }}>
                  <span style={{ fontSize: 18 }}>{a}</span><span style={{ fontSize: 14, color: "rgba(244,243,238,.66)", textAlign: "right" }}>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <div className="stack" style={{ maxWidth: 720, marginBottom: 40 }}>
              <p className="eb">What we prepare together</p>
              <h2 className="h2">The documents a buyer will ask for</h2>
              <p className="lead">If we already manage your rentals, we hold several of these. We collect the rest with you before going live.</p>
            </div>
            <ul className="ticks">
              {["Registry note (nota simple)", "Cadastral reference", "Purchase deed", "Works licence or end-of-works certificate", "Habitability certificate", "Energy certificate", "Last IBI receipt", "Utility and rubbish bills", "Tourist-licence documentation", "Plans", "Mortgage debt certificate", "Council certificate of no open proceedings"].map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </section>

        <section className="section hair-top">
          <div className="wrap split">
            <div className="stack"><p className="eb">Questions owners ask</p><h2 className="h2">Before you decide</h2></div>
            <div className="faq" style={{ borderTop: "1px solid var(--hair)" }}>
              <details open><summary>What is your fee?</summary><p>A percentage of the final sale price plus VAT: part is due when the arras is signed, the rest at the deed. The percentage is set in your mandate.</p></details>
              <details><summary>Can I keep renting while it is for sale?</summary><p>Yes, if you want to. We mark it on the listing so buyers know, and we plan viewings around guests.</p></details>
              <details><summary>Can I use other agents too?</summary><p>That depends on the mandate you choose. An exclusive mandate gives us sole marketing; a non-exclusive one lets you work with others.</p></details>
              <details><summary>How do I end the mandate?</summary><p>Either side can end it with 30 days&apos; notice by email.</p></details>
            </div>
          </div>
        </section>

        <section id="valuation" className="section hair-top">
          <div className="wrap split">
            <div className="stack" style={{ gap: 18 }}>
              <p className="eb">Valuation</p>
              <h2 className="h2">Tell us about your villa</h2>
              <p className="lead">David Ramiro, our Head of Sales, will call you to arrange a visit and a valuation.</p>
            </div>
            <form action={submitValuation} aria-label="Request a valuation" className="formbox">
              {sp.error ? <p className="note-err" role="alert">Please add your name and an email or phone number.</p> : null}
              <div className="cols">
                <div className="field"><label htmlFor="v-name">Full name</label><input id="v-name" name="name" autoComplete="name" required /></div>
                <div className="field"><label htmlFor="v-email">Email</label><input id="v-email" name="email" type="email" autoComplete="email" /></div>
                <div className="field"><label htmlFor="v-phone">Phone</label><input id="v-phone" name="phone" type="tel" autoComplete="tel" /></div>
                <div className="field"><label htmlFor="v-area">Area</label><input id="v-area" name="area" placeholder="e.g. Cala Salada" /></div>
                <div className="field"><label htmlFor="v-beds">Bedrooms</label><select id="v-beds" name="beds"><option>3</option><option>4</option><option>5</option><option>6</option><option>7+</option></select></div>
                <div className="field"><label htmlFor="v-rent">Rented with Invenio?</label><select id="v-rent" name="rented"><option>Yes</option><option>No</option></select></div>
              </div>
              <div className="field"><label htmlFor="v-msg">Anything we should know</label><textarea id="v-msg" name="message" /></div>
              <button className="btn solid" type="submit" style={{ alignSelf: "flex-end" }}>Request a valuation</button>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
