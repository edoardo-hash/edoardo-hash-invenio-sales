import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { getVercelOidcToken } from "@vercel/oidc";
import { EN, type Dict } from "./en";
import { LANG_ENGLISH, type Lang } from ".";

/**
 * Translations by the low-cost text model, as in invenio-portal src/lib/ai-text.ts: DeepSeek through the Vercel AI
 * Gateway, authenticated by the deployment's OIDC token, zero data retention. Only website copy and the public sale
 * text are sent, never client data. Results are kept in Vercel's data cache, keyed by a hash of the English text, so
 * each language is translated once and again only when the English changes. On any failure the page shows English.
 */
const BASE = (process.env.AI_TEXT_BASE_URL || "https://ai-gateway.vercel.sh/v1").replace(/\/+$/, "");
const MODEL = process.env.AI_TEXT_MODEL || "deepseek/deepseek-v4-flash";

const KEEP = "Keep unchanged: {placeholders} in curly braces, Invenio Homes, David Ramiro, Ref., €, numbers, place names, " +
  "e-mail addresses and these Spanish legal terms (they may be followed by a translation in brackets): nota simple, escritura, " +
  "arras, cédula, certificado urbanístico, IBI.";

/** Taken in the request itself (before entering the cache), where the deployment's OIDC token is available. */
async function gatewayToken(): Promise<string | null> {
  return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || (await getVercelOidcToken().catch(() => null));
}

/** After a failed call, this instance shows English for a while instead of making every visitor wait for a retry. */
const failedAt = new Map<string, number>();
const COOLDOWN_MS = 5 * 60_000;
const coolingDown = (key: string) => Date.now() - (failedAt.get(key) ?? 0) < COOLDOWN_MS;

async function complete(token: string | null, system: string, user: string, maxTokens: number): Promise<string> {
  if (!token) throw new Error("no AI gateway credentials");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      providerOptions: { gateway: { zeroDataRetention: true } },
      reasoning: { enabled: false, exclude: true },
    }),
    signal: AbortSignal.timeout(120_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AI text ${res.status}`);
  const body = (await res.json()) as { choices?: { message?: { content?: string }; finish_reason?: string }[] };
  const c = body.choices?.[0];
  if (c?.finish_reason === "length") throw new Error("AI text cut off");
  const text = c?.message?.content?.trim();
  if (!text) throw new Error("AI text empty");
  return text;
}

type Flat = Record<string, string>;
function flatten(o: Record<string, unknown>, pre = ""): Flat {
  const out: Flat = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string") out[pre + k] = v;
    else Object.assign(out, flatten(v as Record<string, unknown>, `${pre}${k}.`));
  }
  return out;
}
function unflatten(flat: Flat, shape: Record<string, unknown>, pre = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(shape)) {
    out[k] = typeof v === "string" ? (typeof flat[pre + k] === "string" && flat[pre + k] ? flat[pre + k] : v) : unflatten(flat, v as Record<string, unknown>, `${pre}${k}.`);
  }
  return out;
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
const json = (text: string) => JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));

const FLAT_EN = flatten(EN);
const EN_HASH = createHash("sha1").update(JSON.stringify(FLAT_EN)).digest("hex").slice(0, 12);

async function translateDict(lang: Lang, token: string | null): Promise<Flat> {
  const system =
    `You translate the website of Invenio Homes, a luxury villa sales agency in Ibiza, from English into ${LANG_ENGLISH[lang]}. ` +
    "Write natural, polished copy for wealthy home buyers and owners, formal address (usted / Lei / u). Short UI labels stay short. " +
    `${KEEP} Answer with one JSON object only: the same keys, translated values.`;
  const out = json(await complete(token, system, JSON.stringify(FLAT_EN), 16_000)) as Flat;
  // Any value that lost or gained a placeholder falls back to English.
  for (const [k, v] of Object.entries(FLAT_EN)) if (typeof out[k] !== "string" || placeholders(out[k]) !== placeholders(v)) out[k] = v;
  return out;
}

/** The page dictionary for a language; English, or English values wherever a translation is missing. */
export async function getDict(lang: Lang): Promise<Dict> {
  if (lang === "en" || coolingDown(`dict:${lang}`)) return EN;
  const token = await gatewayToken();
  try {
    const flat = await unstable_cache(() => translateDict(lang, token), ["dict", lang, EN_HASH], { revalidate: false, tags: ["dict"] })();
    return unflatten(flat, EN) as Dict;
  } catch (e) {
    failedAt.set(`dict:${lang}`, Date.now());
    console.error(`translation ${lang} failed:`, e instanceof Error ? e.message : e);
    return EN; // nothing cached: tried again after the cooldown
  }
}

/** A listing's public sale text in the visitor's language (paragraphs kept). */
export async function translateText(lang: Lang, text: string | null): Promise<string | null> {
  if (!text || lang === "en") return text;
  const key = createHash("sha1").update(text).digest("hex").slice(0, 16);
  if (coolingDown(`text:${lang}:${key}`)) return text;
  const token = await gatewayToken();
  try {
    return await unstable_cache(
      () =>
        complete(
          token,
          `Translate this property description for a luxury villa sales website in Ibiza from English into ${LANG_ENGLISH[lang]}. ` +
            `Keep the paragraphs. ${KEEP} Answer with the translation only.`,
          text,
          4000,
        ),
      ["sale-text", lang, key],
      { revalidate: false, tags: ["sale-text"] },
    )();
  } catch {
    failedAt.set(`text:${lang}:${key}`, Date.now());
    return text;
  }
}
