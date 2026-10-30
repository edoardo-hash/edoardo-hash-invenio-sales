# Invenio Sales — website and agent portal (prototype)

Calacatta design (Hanken Grotesk only, Light headings), built from the "Invenio Sales — Website & Portal" design canvas (30 Oct 2026).

- **Website**: `/` sales home, `/properties` (filters, buyer brief), `/properties/[ref]` (same structure as the rental villa page), `/sell` (owner valuation).
- **Portal**: `/portal` for sale, `/portal/listings/[ref]`, `/portal/requests` board, `/portal/requests/[id]` with owner confirmation and viewings (mandate clause 7).

## Rules kept from the portal

- Sales always show the reference (`V-` + first 6 characters of the villa uuid), never the villa name.
- The public site lists only approved / under-offer listings that are not off-market, Invenio Homes brand only (IH and LV never mix).
- No exact location: the area only. The price shown is always the mandate price (no agent markup).
- Matching logic is copied from `invenio-portal` `src/lib/sales/rules.ts`; keep the two in step.

## Data

Reads and writes the portal's Neon database (the dev/ihtest one) through `DATABASE_URL`:
reads `villa_snapshot`, `villa_sale`, `villa_sale_status`, `sale_document`; writes `sale_contact`, `sale_request`,
`sale_request_villa`, `sale_activity` (migration 068). No schema changes. Owner confirmations and viewings are
logged as `sale_activity` rows with fixed prefixes (`src/lib/rules.ts`) until the portal has tables for them.

Without `DATABASE_URL` every page renders and says the database is not connected.

## Run

```
npm install
DATABASE_URL=... npm run dev
```
