import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const votos = await prisma.votoMvp.findMany({
    where: { partidoId: id },
    include: { jugador: true, user: true },
  });
  return NextResponse.json(votos);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const { jugadorId } = await req.json();
  if (!jugadorId) return NextResponse.json({ error: "jugadorId requerido" }, { status: 400 });

  const voto = await prisma.votoMvp.upsert({
    where: { partidoId_userId: { partidoId: id, userId } },
    update: { jugadorId },
    create: { partidoId: id, userId, jugadorId },
    include: { jugador: true },
  });
  return NextResponse.json(voto);
}
