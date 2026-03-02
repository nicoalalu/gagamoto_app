import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jugadores = await prisma.jugador.findMany({
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    include: { user: true },
  });
  return NextResponse.json(jugadores);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { nombre, apellido, numeroCamiseta } = await req.json();
  if (!nombre || !apellido) return NextResponse.json({ error: "nombre y apellido requeridos" }, { status: 400 });

  const jugador = await prisma.jugador.create({
    data: {
      nombre,
      apellido,
      numeroCamiseta: numeroCamiseta !== undefined ? Number(numeroCamiseta) : null,
    },
  });
  return NextResponse.json(jugador, { status: 201 });
}
