import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const trainer = await requireRole("TRAINER");
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() ?? "";

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [{ isGlobal: true }, { createdById: trainer.id }],
        ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
      },
      orderBy: { name: "asc" },
      take: 30,
    });

    return NextResponse.json({ exercises });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  muscleGroup: z.string().trim().min(1),
  videoUrl: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const trainer = await requireRole("TRAINER");
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

    const exercise = await prisma.exercise.create({
      data: {
        name: parsed.data.name,
        muscleGroup: parsed.data.muscleGroup,
        videoUrl: parsed.data.videoUrl ?? null,
        imageUrl: parsed.data.imageUrl ?? null,
        createdById: trainer.id,
      },
    });

    return NextResponse.json({ exercise });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
