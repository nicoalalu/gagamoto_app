import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const torneos = await prisma.torneo.findMany({ orderBy: { fechaInicio: "desc" } });
  return NextResponse.json(torneos);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { nombre, fechaInicio, fechaFin } = body;

  if (!nombre) return NextResponse.json({ error: "nombre requerido" }, { status: 400 });

  const torneo = await prisma.torneo.create({
    data: {
      nombre,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
    },
  });
  return NextResponse.json(torneo, { status: 201 });
}
