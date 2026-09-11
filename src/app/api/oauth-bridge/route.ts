import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  setSessionCookie,
  createPendingOAuthToken,
  setPendingOAuthCookie,
} from "@/lib/auth";

/**
 * Runs right after a successful OAuth handshake (see src/lib/oauth.ts).
 * Reads the short-lived NextAuth session once, then hands off to this app's
 * own session system: existing users are logged straight in, brand-new
 * users are sent to pick a role before any User row is created.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!session || !email) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (!existing.isActive) {
      return NextResponse.redirect(new URL("/login?disabled=1", req.url));
    }
    const token = await createSessionToken({ userId: existing.id, role: existing.role });
    await setSessionCookie(token);
    const landing = existing.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(landing, req.url));
  }

  const name = session.user?.name?.trim() || email.split("@")[0];
  const provider =
    "provider" in session && typeof session.provider === "string" ? session.provider : "unknown";

  const pendingToken = await createPendingOAuthToken({ email, name, provider });
  await setPendingOAuthCookie(pendingToken);

  return NextResponse.redirect(new URL("/register/complete-oauth", req.url));
}
