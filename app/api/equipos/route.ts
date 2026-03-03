import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-sync: ensure every team name in partidos has an equipo record
  const partidos = await prisma.partido.findMany({ select: { equipo1: true, equipo2: true } });
  const nombres = [...new Set([...partidos.map((p) => p.equipo1), ...partidos.map((p) => p.equipo2)])];
  if (nombres.length > 0) {
    await prisma.equipo.createMany({
      data: nombres.map((nombre) => ({ nombre })),
      skipDuplicates: true,
    });
  }

  const equipos = await prisma.equipo.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(equipos);
}
