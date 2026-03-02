import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const calificaciones = await prisma.calificacion.findMany({
    where: { partidoId: id },
    include: { jugador: true, user: true },
  });
  return NextResponse.json(calificaciones);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const { jugadorId, puntaje } = await req.json();
  if (!jugadorId || puntaje === undefined) {
    return NextResponse.json({ error: "jugadorId y puntaje requeridos" }, { status: 400 });
  }

  const cal = await prisma.calificacion.upsert({
    where: { partidoId_userId_jugadorId: { partidoId: id, userId, jugadorId } },
    update: { puntaje: Number(puntaje) },
    create: { partidoId: id, userId, jugadorId, puntaje: Number(puntaje) },
    include: { jugador: true },
  });
  return NextResponse.json(cal);
}
