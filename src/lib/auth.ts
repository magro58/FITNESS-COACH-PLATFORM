import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "fcp_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: Role;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { SESSION_COOKIE };

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true },
  });
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Non autenticato", 401);
  if (!user.isActive) throw new AuthError("Account disabilitato", 403);
  return user;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) throw new AuthError("Non autorizzato", 403);
  return user;
}

// --- Pending OAuth identity -------------------------------------------------
// Short-lived, separate from the real session cookie. Holds the
// provider-verified identity (email/name/provider) between the OAuth
// callback and the role-selection step for a brand-new user (see
// /api/oauth-bridge and /register/complete-oauth) — nothing is written to
// the database until the person actually picks a role.

const PENDING_OAUTH_COOKIE = "fcp_pending_oauth";
const PENDING_OAUTH_DURATION_SECONDS = 10 * 60; // 10 minutes

export interface PendingOAuthIdentity {
  email: string;
  name: string;
  provider: string;
}

export async function createPendingOAuthToken(identity: PendingOAuthIdentity): Promise<string> {
  return new SignJWT({ ...identity })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_OAUTH_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function setPendingOAuthCookie(token: string) {
  const store = await cookies();
  store.set(PENDING_OAUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_OAUTH_DURATION_SECONDS,
  });
}

export async function clearPendingOAuthCookie() {
  const store = await cookies();
  store.delete(PENDING_OAUTH_COOKIE);
}

export async function getPendingOAuthIdentity(): Promise<PendingOAuthIdentity | null> {
  const store = await cookies();
  const token = store.get(PENDING_OAUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return {
      email: payload.email,
      name: payload.name,
      provider: typeof payload.provider === "string" ? payload.provider : "unknown",
    };
  } catch {
    return null;
  }
}
