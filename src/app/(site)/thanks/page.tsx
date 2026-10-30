import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";

const TEXT: Record<string, [string, string]> = {
  brief: ["Thank you, we have your brief", "David or one of our agents will contact you with homes that match, including private ones."],
  enquiry: ["Thank you, we have your request", "Before we share the address and documents we register you with the owner. We'll be in touch as soon as they confirm."],
  valuation: ["Thank you, we'll call you", "David Ramiro will contact you to arrange a visit and a valuation."],
};

export default async function Thanks({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [h, p] = sp.offline ? ["This form isn't connected yet", "The database isn't connected to this deployment, so nothing was saved."] : TEXT[sp.kind ?? ""] ?? TEXT.brief;
  return (
    <>
      <SiteHeader />
      <main className="wrap section stack" style={{ maxWidth: 820 }}>
        <p className="eb">Invenio Homes · Sales</p>
        <h1 style={{ fontSize: "clamp(36px,4vw,56px)", lineHeight: 1.1 }}>{h}</h1>
        <p className="lead">{p}</p>
        <div className="actions"><Link className="btn solid" href="/properties">Back to properties</Link><Link className="lnk" href="/">Sales home</Link></div>
      </main>
      <SiteFooter />
    </>
  );
}
