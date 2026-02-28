import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { isVotingWindowOpen, isMatchPlayed } from "@/lib/utils";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const ratingsSchema = z.object({
  ratings: z.array(
    z.object({
      ratedUserId: z.string().min(1),
      score: z.number().int().min(1).max(10),
    })
  ),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const ratings = await prisma.rating.findMany({
    where: { matchId: id },
    include: {
      rater: { select: { id: true, name: true } },
      ratedUser: { select: { id: true, name: true, image: true } },
    },
  });

  // Compute averages per rated user
  type UserAvg = { userId: string; name: string; image: string | null; avg: number; count: number };
  const avgByUser: Record<string, UserAvg> = {};
  for (const r of ratings) {
    if (!avgByUser[r.ratedUserId]) {
      avgByUser[r.ratedUserId] = { userId: r.ratedUserId, name: r.ratedUser.name ?? "", image: r.ratedUser.image, avg: 0, count: 0 };
    }
    avgByUser[r.ratedUserId].avg += r.score;
    avgByUser[r.ratedUserId].count += 1;
  }
  for (const key of Object.keys(avgByUser)) {
    avgByUser[key].avg = Math.round((avgByUser[key].avg / avgByUser[key].count) * 10) / 10;
  }

  return NextResponse.json({ ratings, averages: Object.values(avgByUser) });
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
    return NextResponse.json({ error: "La ventana de rating ya cerró (24hs)" }, { status: 400 });
  }
  if (match.goalsFor === null) {
    return NextResponse.json({ error: "El partido no tiene resultado cargado aún" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = ratingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Validate no self-rating
  if (parsed.data.ratings.some(r => r.ratedUserId === session.user.id)) {
    return NextResponse.json({ error: "No podés calificarte a vos mismo" }, { status: 400 });
  }

  // Upsert all ratings
  const results = await Promise.all(
    parsed.data.ratings.map(r =>
      prisma.rating.upsert({
        where: { matchId_raterId_ratedUserId: { matchId: id, raterId: session.user.id, ratedUserId: r.ratedUserId } },
        create: { matchId: id, raterId: session.user.id, ratedUserId: r.ratedUserId, score: r.score },
        update: { score: r.score },
      })
    )
  );

  return NextResponse.json(results, { status: 201 });
}
