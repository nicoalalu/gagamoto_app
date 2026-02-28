import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isMatchFuture } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const attendanceSchema = z.object({
  status: z.enum(["YES", "NO"]),
  excuse: z.string().optional().nullable(),
});

// GET - list attendance for a match
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const attendance = await prisma.attendance.findMany({
    where: { matchId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(attendance);
}

// POST/PUT - upsert own attendance
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  if (!isMatchFuture(match.date)) {
    return NextResponse.json({ error: "Solo podés confirmar asistencia a partidos futuros" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = attendanceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.status === "NO" && !parsed.data.excuse?.trim()) {
    return NextResponse.json({ error: "Debés justificar la ausencia" }, { status: 400 });
  }

  const attendance = await prisma.attendance.upsert({
    where: { matchId_userId: { matchId: id, userId: session.user.id } },
    create: {
      matchId: id,
      userId: session.user.id,
      status: parsed.data.status,
      excuse: parsed.data.status === "NO" ? parsed.data.excuse : null,
    },
    update: {
      status: parsed.data.status,
      excuse: parsed.data.status === "NO" ? parsed.data.excuse : null,
    },
  });

  return NextResponse.json(attendance);
}
