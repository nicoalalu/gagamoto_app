import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      attendance: { include: { user: { select: { id: true, name: true, image: true } } } },
      goals: { include: { user: { select: { id: true, name: true, image: true } } } },
      cards: { include: { user: { select: { id: true, name: true, image: true } } } },
      mvpVotes: { include: { voter: { select: { id: true, name: true } }, votedUser: { select: { id: true, name: true } } } },
      ratings: { include: { rater: { select: { id: true, name: true } }, ratedUser: { select: { id: true, name: true } } } },
      mvpUser: { select: { id: true, name: true, image: true } },
    },
  });

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(match);
}

const updateMatchSchema = z.object({
  date: z.string().optional(),
  opponent: z.string().min(1).max(100).optional(),
  goalsFor: z.number().int().min(0).optional().nullable(),
  goalsAgainst: z.number().int().min(0).optional().nullable(),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const parsed = updateMatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.date !== undefined) data.date = new Date(parsed.data.date);
  if (parsed.data.opponent !== undefined) data.opponent = parsed.data.opponent;
  if (parsed.data.goalsFor !== undefined) data.goalsFor = parsed.data.goalsFor;
  if (parsed.data.goalsAgainst !== undefined) data.goalsAgainst = parsed.data.goalsAgainst;

  // When a result is added, compute and persist MVP
  if (parsed.data.goalsFor !== undefined && parsed.data.goalsFor !== null) {
    const votes = await prisma.mvpVote.groupBy({
      by: ["votedUserId"],
      where: { matchId: id },
      _count: { votedUserId: true },
      orderBy: { _count: { votedUserId: "desc" } },
    });
    if (votes.length > 0) {
      data.mvpUserId = votes[0].votedUserId;
    }
  }

  const match = await prisma.match.update({ where: { id }, data });
  return NextResponse.json(match);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
