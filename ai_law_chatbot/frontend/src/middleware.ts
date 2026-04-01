import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't prefix the default locale (e.g., /about instead of /en/about)
  localePrefix: "as-needed",
});

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // Get the normalized path without locale prefix
  const pathnameWithoutLocale = pathname.replace(new RegExp(`^/(${locales.join("|")})`), "") || "/";
  
  const isAuthPage = 
    pathnameWithoutLocale.startsWith("/login") || 
    pathnameWithoutLocale.startsWith("/register");

  // Redirect to login if not authenticated and not on an auth page
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if authenticated and on an auth page or the home/root page
  if (token && (isAuthPage || pathnameWithoutLocale === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for:
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /static (inside /public)
    // - /_vercel (Vercel internals)
    // - All root files like favicon.ico, robots.txt, etc.
    "/((?!api|_next|_vercel|static|.*\\..*).*)",
  ],
};
