import { NextRequest, NextResponse } from "next/server";
import { SITE_ACCESS_COOKIE, siteAccessEnabled, verifySiteAccessToken } from "@/lib/siteAccess";

const PUBLIC_PATHS = [
  "/enter",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline.html",
  "/icon.svg",
  "/icon-maskable.svg",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  if (!siteAccessEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/site-access") ||
    pathname.startsWith("/verify/")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SITE_ACCESS_COOKIE)?.value;
  const allowed = await verifySiteAccessToken(token);
  if (allowed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/enter";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
