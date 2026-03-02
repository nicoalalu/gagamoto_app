import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      torneo: true,
      goles: { include: { jugador: true } },
      tarjetas: { include: { jugador: true } },
      asistencias: { include: { user: true } },
      votos: { include: { jugador: true, user: true } },
      calificaciones: { include: { jugador: true, user: true } },
      mvpJugador: true,
    },
  });

  if (!partido) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(partido);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const partido = await prisma.partido.update({
    where: { id },
    data: {
      ...(body.golesEquipo1 !== undefined && { golesEquipo1: Number(body.golesEquipo1) }),
      ...(body.golesEquipo2 !== undefined && { golesEquipo2: Number(body.golesEquipo2) }),
      ...(body.jugado !== undefined && { jugado: Boolean(body.jugado) }),
      ...(body.mvpJugadorId !== undefined && { mvpJugadorId: body.mvpJugadorId }),
      ...(body.fecha !== undefined && { fecha: body.fecha ? new Date(body.fecha) : null }),
      ...(body.lugar !== undefined && { lugar: body.lugar }),
      ...(body.torneoId !== undefined && { torneoId: body.torneoId }),
    },
  });

  return NextResponse.json(partido);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.partido.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
