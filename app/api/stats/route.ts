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

  type UserRow = typeof users[number];
  type PlayedMatch = typeof playedMatches[number];
  type Goal = typeof goals[number];
  type Card = typeof cards[number];
  type Rating = typeof ratings[number];

  const totalPlayed = playedMatches.length;
  const wins = playedMatches.filter((m: PlayedMatch) => m.goalsFor! > m.goalsAgainst!).length;
  const draws = playedMatches.filter((m: PlayedMatch) => m.goalsFor === m.goalsAgainst).length;
  const losses = totalPlayed - wins - draws;
  const goalsFor = playedMatches.reduce((s: number, m: PlayedMatch) => s + (m.goalsFor ?? 0), 0);
  const goalsAgainst = playedMatches.reduce((s: number, m: PlayedMatch) => s + (m.goalsAgainst ?? 0), 0);

  const playerStats = users.map((user: UserRow) => {
    const userGoals = goals.filter((g: Goal) => g.userId === user.id).length;
    const userYellow = cards.filter((c: Card) => c.userId === user.id && c.type === "YELLOW").length;
    const userRed = cards.filter((c: Card) => c.userId === user.id && c.type === "RED").length;
    const mvpWins = playedMatches.filter((m: PlayedMatch) => m.mvpUserId === user.id).length;
    const userRatings = ratings.filter((r: Rating) => r.ratedUserId === user.id);
    const avgRating = userRatings.length
      ? Math.round((userRatings.reduce((s: number, r: Rating) => s + r.score, 0) / userRatings.length) * 10) / 10
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
