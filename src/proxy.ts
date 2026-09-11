import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "fcp_session";
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/register-oauth",
  "/api/oauth", // covers /api/oauth/* (NextAuth handshake) and /api/oauth-bridge
];
const TRAINER_ONLY_PREFIXES = ["/students", "/plans"];
const STUDENT_ONLY_PREFIXES = ["/my-plan", "/train", "/progress"];
const ADMIN_PREFIX = "/admin";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function readSession(token: string | undefined): Promise<{ role?: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") ||
    pathname.match(/\.(svg|png|jpg|jpeg|ico|css|js|webmanifest)$/)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token);
  const authed = !!session;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  if (!authed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = session?.role === "ADMIN" ? ADMIN_PREFIX : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Admins get their own section; they don't use the trainer/student app shell.
  // API routes are excluded here — they're authorized per-request by
  // requireAdmin()/requireUser() in the handler, not by this page-level redirect.
  if (authed && session?.role === "ADMIN") {
    if (!pathname.startsWith("/api") && !pathname.startsWith(ADMIN_PREFIX)) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_PREFIX;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (authed && !pathname.startsWith("/api") && pathname.startsWith(ADMIN_PREFIX)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (authed && session?.role === "STUDENT" && TRAINER_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (authed && session?.role === "TRAINER" && STUDENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
