import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const goles = await prisma.gol.findMany({
    where: { partidoId: id },
    include: { jugador: true },
  });
  return NextResponse.json(goles);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { jugadorId, minuto, equipo } = await req.json();
  if (!jugadorId) return NextResponse.json({ error: "jugadorId requerido" }, { status: 400 });

  const gol = await prisma.gol.create({
    data: { partidoId: id, jugadorId, minuto: minuto ?? null, equipo: equipo ?? null },
    include: { jugador: true },
  });
  return NextResponse.json(gol, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await params; // consume
  const { golId } = await req.json();
  await prisma.gol.delete({ where: { id: golId } });
  return NextResponse.json({ ok: true });
}
