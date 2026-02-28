import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isMatchPlayed } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const resultSchema = z.object({
  goalsFor: z.number().int().min(0),
  goalsAgainst: z.number().int().min(0),
});

// POST - add/update result
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });

  if (!isMatchPlayed(match.date)) {
    return NextResponse.json(
      { error: "Solo podés cargar resultados de partidos ya jugados" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = resultSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Compute MVP from existing votes
  const votes = await prisma.mvpVote.groupBy({
    by: ["votedUserId"],
    where: { matchId: id },
    _count: { votedUserId: true },
    orderBy: { _count: { votedUserId: "desc" } },
  });

  const updated = await prisma.match.update({
    where: { id },
    data: {
      goalsFor: parsed.data.goalsFor,
      goalsAgainst: parsed.data.goalsAgainst,
      mvpUserId: votes.length > 0 ? votes[0].votedUserId : undefined,
    },
  });

  return NextResponse.json(updated);
}
