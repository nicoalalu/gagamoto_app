import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseCSV, GAGAMOTO } from "@/lib/constants";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const torneoId = searchParams.get("torneoId");

  const partidos = await prisma.partido.findMany({
    where: torneoId ? { torneoId } : undefined,
    include: {
      torneo: true,
      goles: { include: { jugador: true } },
      tarjetas: { include: { jugador: true } },
      mvpJugador: true,
    },
    orderBy: { fecha: "asc" },
  });
  return NextResponse.json(partidos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { torneoId, equipo1, equipo2, fecha, lugar } = body;

  if (!equipo1 || !equipo2) {
    return NextResponse.json({ error: "equipo1 y equipo2 requeridos" }, { status: 400 });
  }

  const partido = await prisma.partido.create({
    data: {
      torneoId: torneoId || null,
      equipo1,
      equipo2,
      fecha: fecha ? new Date(fecha) : null,
      lugar: lugar || null,
    },
  });
  return NextResponse.json(partido, { status: 201 });
}
