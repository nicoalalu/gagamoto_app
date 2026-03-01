import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [users, playedMatches, goals, cards, ratings, mvpVotes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, image: true, email: true } }),
    prisma.match.findMany({ where: { goalsFor: { not: null } } }),
    prisma.goal.findMany(),
    prisma.card.findMany(),
    prisma.rating.findMany(),
    prisma.mvpVote.findMany(),
  ]);

  type MatchRow = (typeof playedMatches)[number];
  type GoalRow = (typeof goals)[number];
  type CardRow = (typeof cards)[number];
  type RatingRow = (typeof ratings)[number];
  type UserRow = (typeof users)[number];

  const totalPlayed = playedMatches.length;
  const wins = playedMatches.filter((m: MatchRow) => m.goalsFor! > m.goalsAgainst!).length;
  const draws = playedMatches.filter((m: MatchRow) => m.goalsFor === m.goalsAgainst).length;
  const losses = totalPlayed - wins - draws;
  const goalsFor = playedMatches.reduce((s: number, m: MatchRow) => s + (m.goalsFor ?? 0), 0);
  const goalsAgainst = playedMatches.reduce((s: number, m: MatchRow) => s + (m.goalsAgainst ?? 0), 0);

  const playerStats = users.map((user: UserRow) => {
    const userGoals = goals.filter((g: GoalRow) => g.userId === user.id).length;
    const userYellow = cards.filter((c: CardRow) => c.userId === user.id && c.type === "YELLOW").length;
    const userRed = cards.filter((c: CardRow) => c.userId === user.id && c.type === "RED").length;
    const mvpWins = playedMatches.filter((m: MatchRow) => m.mvpUserId === user.id).length;
    const userRatings = ratings.filter((r: RatingRow) => r.ratedUserId === user.id);
    const avgRating = userRatings.length
      ? Math.round((userRatings.reduce((s: number, r: RatingRow) => s + r.score, 0) / userRatings.length) * 10) / 10
      : null;

    return {
      ...user,
      goals: userGoals,
      yellowCards: userYellow,
      redCards: userRed,
      mvpWins,
      avgRating,
      ratingsCount: userRatings.length,
    };
  });

  return NextResponse.json({
    team: { totalPlayed, wins, draws, losses, goalsFor, goalsAgainst },
    players: playerStats,
  });
}
