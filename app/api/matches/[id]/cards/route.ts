import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isMatchPlayed } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const cardSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["YELLOW", "RED"]),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const cards = await prisma.card.findMany({
    where: { matchId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(cards);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  if (!isMatchPlayed(match.date)) {
    return NextResponse.json({ error: "El partido aún no se jugó" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = cardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const card = await prisma.card.create({
    data: { matchId: id, userId: parsed.data.userId, type: parsed.data.type },
  });
  return NextResponse.json(card, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get("cardId");
  if (!cardId) return NextResponse.json({ error: "cardId requerido" }, { status: 400 });

  await prisma.card.delete({ where: { id: cardId } });
  return NextResponse.json({ ok: true });
}
