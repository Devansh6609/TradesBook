import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that are accessible without authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals through
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Read our custom auth token from cookie (set after login)
  const token = request.cookies.get("tradefxbook_access_token")?.value;

  // Redirect unauthenticated users to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|api).*)" ],
};

