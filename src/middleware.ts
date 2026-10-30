import { NextResponse, type NextRequest } from "next/server";

/**
 * The portal shows buyers' names and contact details, so it is locked: HTTP Basic auth against PORTAL_PASSWORD
 * (any user name). With no PORTAL_PASSWORD set, the portal is closed to everyone (fails closed).
 * Server actions post to the page URL, so they are covered too.
 */
export function middleware(req: NextRequest) {
  const pass = process.env.PORTAL_PASSWORD;
  if (!pass) {
    return new NextResponse("The sales portal is locked: set PORTAL_PASSWORD on this Vercel project.", { status: 503 });
  }
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

export const config = { matcher: ["/portal", "/portal/:path*"] };
