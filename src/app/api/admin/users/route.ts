import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["TRAINER", "STUDENT", "ADMIN"];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const q = req.nextUrl.searchParams.get("q")?.trim();
    const roleParam = req.nextUrl.searchParams.get("role");
    const role = roleParam && VALID_ROLES.includes(roleParam as Role) ? (roleParam as Role) : undefined;

    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { profile: { displayName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { profile: true },
      take: 200,
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        oauthProvider: u.oauthProvider,
        createdAt: u.createdAt,
        profile: u.profile,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
