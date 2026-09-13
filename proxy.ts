import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// Optimistic gate only — checks that the session cookie is merely present,
// no JWT verify or DB call here (proxy runs on every request and shouldn't
// do expensive work). The real, authoritative check is `requireSession()` /
// `requireOwner()`, called independently by every admin page and every
// Server Action. Never rely on this file as the sole line of defense.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
