import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isMatchPlayed } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const goalSchema = z.object({
  userId: z.string().min(1),
});

// GET
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goals = await prisma.goal.findMany({
    where: { matchId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  return NextResponse.json(goals);
}

// POST - add a goal
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
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const goal = await prisma.goal.create({
    data: { matchId: id, userId: parsed.data.userId },
  });
  return NextResponse.json(goal, { status: 201 });
}

// DELETE - remove last goal for a user
export async function DELETE(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");
  if (!goalId) return NextResponse.json({ error: "goalId requerido" }, { status: 400 });

  await prisma.goal.delete({ where: { id: goalId } });
  return NextResponse.json({ ok: true });
}
