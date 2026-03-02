import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const asistencias = await prisma.asistencia.findMany({
    where: { partidoId: id },
    include: { user: true },
  });
  return NextResponse.json(asistencias);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const { estado } = await req.json();

  const asistencia = await prisma.asistencia.upsert({
    where: { partidoId_userId: { partidoId: id, userId } },
    update: { estado },
    create: { partidoId: id, userId, estado },
  });
  return NextResponse.json(asistencia);
}
