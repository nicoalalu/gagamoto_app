import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isVotingWindowOpen, isMatchPlayed } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const voteSchema = z.object({
  votedUserId: z.string().min(1),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const votes = await prisma.mvpVote.findMany({
    where: { matchId: id },
    include: {
      voter: { select: { id: true, name: true } },
      votedUser: { select: { id: true, name: true, image: true } },
    },
  });
  return NextResponse.json(votes);
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
  if (!isVotingWindowOpen(match.date)) {
    return NextResponse.json({ error: "La ventana de votación ya cerró (24hs)" }, { status: 400 });
  }
  if (match.goalsFor === null) {
    return NextResponse.json({ error: "El partido no tiene resultado cargado aún" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.votedUserId === session.user.id) {
    return NextResponse.json({ error: "No podés votarte a vos mismo" }, { status: 400 });
  }

  const vote = await prisma.mvpVote.upsert({
    where: { matchId_voterId: { matchId: id, voterId: session.user.id } },
    create: { matchId: id, voterId: session.user.id, votedUserId: parsed.data.votedUserId },
    update: { votedUserId: parsed.data.votedUserId },
  });

  // Recompute MVP
  const votes = await prisma.mvpVote.groupBy({
    by: ["votedUserId"],
    where: { matchId: id },
    _count: { votedUserId: true },
    orderBy: { _count: { votedUserId: "desc" } },
  });
  if (votes.length > 0) {
    await prisma.match.update({ where: { id }, data: { mvpUserId: votes[0].votedUserId } });
  }

  return NextResponse.json(vote, { status: 201 });
}
