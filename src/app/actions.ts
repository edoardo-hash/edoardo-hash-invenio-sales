"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ACTOR, hasDb, q } from "@/lib/db";
import { isRequestStatus, MUST_HAVES, OWNER_ASKED, OWNER_CONFIRMED, VIEWING_CONFIRMED, VIEWING_PROPOSED } from "@/lib/rules";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const money = (v: string) => {
  const n = Number(v.replace(/[^\d.]/g, ""));
  if (!n) return null;
  return n < 1000 ? n * 1e6 : n; // "3.5" means €3.5M
};
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

async function newContact(kind: "buyer" | "owner", f: FormData, notes: string | null): Promise<number> {
  const rows = await q<{ id: string }>(
    `insert into sale_contact (kind, name, email, phone, source, notes, created_by) values ($1, $2, $3, $4, 'website', $5, $6) returning id::text`,
    [kind, s(f, "name"), s(f, "email") || null, s(f, "phone") || null, notes, ACTOR.email],
  );
  return Number(rows[0].id);
}

/** Website: buyer brief → a buyer contact and a new request, source "website". */
export async function submitBrief(f: FormData) {
  if (!s(f, "name") || (!s(f, "email") && !s(f, "phone"))) redirect("/properties?error=brief#brief");
  if (!hasDb()) redirect("/thanks?offline=1");
  const contactId = await newContact("buyer", f, null);
  const areas = s(f, "areas").split(",").map((a) => a.trim()).filter(Boolean);
  const must = MUST_HAVES.map((m) => m.key).filter((k) => f.get(`m_${k}`) === "on");
  const beds = Number(s(f, "beds")) || null;
  await q(
    `insert into sale_request (contact_id, budget_min_eur, budget_max_eur, areas, min_bedrooms, must_haves, licence_needed, timing, source, notes, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'website', $9, $10)`,
    [contactId, money(s(f, "min")), money(s(f, "max")), areas, beds, must, must.includes("licence"), s(f, "timing") || null, s(f, "message") || null, ACTOR.email],
  );
  redirect("/thanks?kind=brief");
}

/** Website: "Request details" / "Arrange a viewing" on a property → buyer, request and a note on the villa. */
export async function submitEnquiry(f: FormData) {
  const ref = s(f, "ref");
  const uuid = s(f, "uuid");
  if (!s(f, "name") || (!s(f, "email") && !s(f, "phone"))) redirect(`/properties/${encodeURIComponent(ref)}?error=1#enquire`);
  if (!hasDb()) redirect("/thanks?offline=1");
  const contactId = await newContact("buyer", f, null);
  const what = s(f, "what") === "viewing" ? "Would like a viewing" : "Asked for details";
  const req = await q<{ id: string }>(
    `insert into sale_request (contact_id, source, notes, created_by) values ($1, 'website', $2, $3) returning id::text`,
    [contactId, `${what} of ${ref}. ${s(f, "message")}`.trim(), ACTOR.email],
  );
  await q(
    `insert into sale_activity (request_id, villa_uuid, contact_id, kind, body, happened_on, author_email, author_name)
     values ($1, $2::uuid, $3, 'note', $4, $5, $6, $7)`,
    [Number(req[0].id), uuid, contactId, `Website enquiry: ${what.toLowerCase()} of ${ref}`, today(), ACTOR.email, ACTOR.name],
  );
  redirect("/thanks?kind=enquiry");
}

/** Website: owner valuation request → an owner contact with the details in its notes. */
export async function submitValuation(f: FormData) {
  if (!s(f, "name") || (!s(f, "email") && !s(f, "phone"))) redirect("/sell?error=1#valuation");
  if (!hasDb()) redirect("/thanks?offline=1");
  const notes = `Valuation request from the website. Area: ${s(f, "area") || "?"}. Bedrooms: ${s(f, "beds") || "?"}. Rented with Invenio: ${s(f, "rented") || "?"}. ${s(f, "message")}`.trim();
  await newContact("owner", f, notes);
  redirect("/thanks?kind=valuation");
}

// ---- portal ----------------------------------------------------------------------------------------------------

export async function setRequestStatus(f: FormData) {
  const id = Number(s(f, "id"));
  const status = s(f, "status");
  if (id && isRequestStatus(status) && hasDb()) {
    await q("update sale_request set status = $2, updated_at = now() where id = $1", [id, status]);
    await q(
      `insert into sale_activity (request_id, kind, body, happened_on, author_email, author_name) values ($1, 'note', $2, $3, $4, $5)`,
      [id, `Status changed to ${status}`, today(), ACTOR.email, ACTOR.name],
    );
  }
  revalidatePath(`/portal/requests/${id}`);
  redirect(`/portal/requests/${id}`);
}

/** Mandate clause 7: log that the buyer's name and ID went to the owner, or that the owner confirmed by email. */
export async function ownerStep(f: FormData) {
  const id = Number(s(f, "id"));
  const uuid = s(f, "uuid");
  const ref = s(f, "ref");
  const step = s(f, "step");
  if (id && uuid && hasDb()) {
    const body = step === "confirmed" ? `${OWNER_CONFIRMED}${ref}` : `${OWNER_ASKED}${ref}`;
    await q(
      `insert into sale_activity (request_id, villa_uuid, kind, body, happened_on, author_email, author_name) values ($1, $2::uuid, 'email', $3, $4, $5, $6)`,
      [id, uuid, body, today(), ACTOR.email, ACTOR.name],
    );
  }
  revalidatePath(`/portal/requests/${id}`);
  redirect(`/portal/requests/${id}`);
}

export async function viewingStep(f: FormData) {
  const id = Number(s(f, "id"));
  const uuid = s(f, "uuid");
  const ref = s(f, "ref");
  if (id && uuid && hasDb()) {
    const body =
      s(f, "step") === "confirmed"
        ? `${VIEWING_CONFIRMED}${ref}`
        : `${VIEWING_PROPOSED}${ref}, ${s(f, "when").replace("T", " ")}${s(f, "who") ? `, ${s(f, "who")}` : ""}`;
    await q(
      `insert into sale_activity (request_id, villa_uuid, kind, body, happened_on, author_email, author_name) values ($1, $2::uuid, 'viewing', $3, $4, $5, $6)`,
      [id, uuid, body, today(), ACTOR.email, ACTOR.name],
    );
  }
  revalidatePath(`/portal/requests/${id}`);
  redirect(`/portal/requests/${id}`);
}

/** Matches → "Send": records the villa as sent to the request (only after the owner confirmed the buyer). */
export async function sendVilla(f: FormData) {
  const id = Number(s(f, "id"));
  const uuid = s(f, "uuid");
  if (id && uuid && hasDb()) {
    await q(
      `insert into sale_request_villa (request_id, villa_uuid, state, noted_by) values ($1, $2::uuid, $3, $4)
       on conflict (request_id, villa_uuid) do update set state = excluded.state, noted_by = excluded.noted_by, noted_at = now()`,
      [id, uuid, s(f, "state") || "sent", ACTOR.email],
    );
  }
  revalidatePath(`/portal/requests/${id}`);
  redirect(`/portal/requests/${id}`);
}

export async function addActivity(f: FormData) {
  const id = Number(s(f, "id"));
  const body = s(f, "body");
  const kind = ["note", "call", "email", "whatsapp", "viewing", "offer"].includes(s(f, "kind")) ? s(f, "kind") : "note";
  if (id && body && hasDb()) {
    await q(
      `insert into sale_activity (request_id, kind, body, happened_on, author_email, author_name) values ($1, $2, $3, $4, $5, $6)`,
      [id, kind, body, today(), ACTOR.email, ACTOR.name],
    );
  }
  revalidatePath(`/portal/requests/${id}`);
  redirect(`/portal/requests/${id}`);
}
