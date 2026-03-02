import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const tarjetas = await prisma.tarjeta.findMany({
    where: { partidoId: id },
    include: { jugador: true },
  });
  return NextResponse.json(tarjetas);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { jugadorId, tipo, minuto } = await req.json();
  if (!jugadorId || !tipo) return NextResponse.json({ error: "jugadorId y tipo requeridos" }, { status: 400 });

  const tarjeta = await prisma.tarjeta.create({
    data: { partidoId: id, jugadorId, tipo, minuto: minuto ?? null },
    include: { jugador: true },
  });
  return NextResponse.json(tarjeta, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await params;
  const { tarjetaId } = await req.json();
  await prisma.tarjeta.delete({ where: { id: tarjetaId } });
  return NextResponse.json({ ok: true });
}
