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

  const seg = pathname.split("/")[1] ?? "";
  if (seg === "en") {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  const headers = new Headers(req.headers);
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

function portal(req: NextRequest) {
  const pass = process.env.PORTAL_PASSWORD;
  if (!pass) return new NextResponse("The sales portal is locked: set PORTAL_PASSWORD on this Vercel project.", { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given.length === pass.length && given === pass) return NextResponse.next();
  }
  return new NextResponse("Sign in to the Invenio sales portal.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Invenio sales portal", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/((?!_next/|favicon|.*\\.(?:svg|jpg|jpeg|png|webp|ico|txt|xml)$).*)"] };
