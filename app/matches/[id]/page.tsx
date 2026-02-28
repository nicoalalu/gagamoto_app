import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { formatDate, isMatchPlayed, isVotingWindowOpen, isMatchFuture } from "@/lib/utils";
import { notFound } from "next/navigation";
import MatchDetailClient from "./MatchDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function MatchDetailPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      attendance: { include: { user: { select: { id: true, name: true, image: true } } } },
      goals: { include: { user: { select: { id: true, name: true, image: true } } } },
      cards: { include: { user: { select: { id: true, name: true, image: true } } } },
      mvpVotes: {
        include: {
          voter: { select: { id: true, name: true } },
          votedUser: { select: { id: true, name: true, image: true } },
        },
      },
      ratings: {
        include: {
          rater: { select: { id: true, name: true } },
          ratedUser: { select: { id: true, name: true, image: true } },
        },
      },
      mvpUser: { select: { id: true, name: true, image: true } },
    },
  });

  if (!match) notFound();

  const allPlayers = await prisma.user.findMany({
    select: { id: true, name: true, image: true },
    orderBy: { name: "asc" },
  });

  const played = isMatchPlayed(match.date);
  const future = isMatchFuture(match.date);
  const votingOpen = played && isVotingWindowOpen(match.date) && match.goalsFor !== null;

  return (
    <MatchDetailClient
      match={JSON.parse(JSON.stringify(match))}
      players={allPlayers}
      currentUserId={session!.user.id}
      played={played}
      future={future}
      votingOpen={votingOpen}
    />
  );
}
