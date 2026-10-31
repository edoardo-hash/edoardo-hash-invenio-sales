import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["es", "it", "nl"];

/**
 * 1. The portal shows buyers' names and contact details, so it is locked: HTTP Basic auth against PORTAL_PASSWORD
 *    (any user name). With no PORTAL_PASSWORD set it is closed to everyone. Server actions post to the page URL,
 *    so they are covered too.
 * 2. The public site: English at the plain URLs (rewritten to /en/...), Spanish, Italian and Dutch under /es, /it, /nl.
 *    x-lang and x-path tell the pages which language and which path (for the language switcher).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return portal(req);
  // Whole-site lock (Edo, 30 Oct 2026: only he has access to dev): with SITE_PASSWORD set on a branch, every public
  // page asks for it too. The dev branch sets PORTAL_PASSWORD to the same value, so one sign-in covers both.
  const sitePass = process.env.SITE_PASSWORD;
  if (sitePass && basicPassword(req) !== sitePass) return askPassword("Invenio sales (development)");

  const seg = pathname.split("/")[1] ?? "";
  if (seg === "en") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const headers = new Headers(req.headers);
  headers.delete("x-portal-role"); // the public site never has a portal role
  headers.delete("x-portal-user");
  if (LOCALES.includes(seg)) {
    headers.set("x-lang", seg);
    headers.set("x-path", pathname.slice(seg.length + 1) || "/");
    return NextResponse.next({ request: { headers } });
  }
  headers.set("x-lang", "en");
  headers.set("x-path", pathname);
  const url = req.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

/**
 * Who is looking (Edo, 30 Oct 2026): PORTAL_PASSWORD = admin (sees the villa's Invenio name and real name),
 * PORTAL_AGENT_PASSWORD (optional, for external sales agents later) = agent (reference codes only).
 * The role travels to the pages in x-portal-role, always set here so a browser can't send its own.
 */
function portal(req: NextRequest) {
  const pass = process.env.PORTAL_PASSWORD;
  if (!pass) return new NextResponse("The sales portal is locked: set PORTAL_PASSWORD on this Vercel project.", { status: 503 });
  const agentPass = process.env.PORTAL_AGENT_PASSWORD;
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const given = decoded.slice(decoded.indexOf(":") + 1);
    const role = given === pass ? "admin" : agentPass && given === agentPass ? "agent" : null;
    if (role) {
      const headers = new Headers(req.headers);
      headers.set("x-portal-role", role);
      // The user name typed at sign-in (any text): only to say who approved a listing, never for access.
      const user = decoded.slice(0, Math.max(0, decoded.indexOf(":"))).replace(/[^\p{L}\p{N} .@'_-]/gu, "").trim().slice(0, 60);
      headers.set("x-portal-user", encodeURIComponent(user));
      return NextResponse.next({ request: { headers } });
    }
  }
  return askPassword("Invenio sales portal");
}

function basicPassword(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return null;
  const decoded = atob(auth.slice(6));
  return decoded.slice(decoded.indexOf(":") + 1);
}

function askPassword(realm: string) {
  return new NextResponse(`Sign in to ${realm}.`, {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"` },
  });
}

export const config = { matcher: ["/((?!_next/|favicon|.*\\.(?:svg|jpg|jpeg|png|webp|ico|txt|xml)$).*)"] };
