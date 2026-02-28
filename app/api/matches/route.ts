import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createMatchSchema = z.object({
  date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  opponent: z.string().min(1).max(100),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
    include: {
      attendance: { include: { user: { select: { id: true, name: true, image: true } } } },
      goals: { include: { user: { select: { id: true, name: true } } } },
      cards: { include: { user: { select: { id: true, name: true } } } },
      mvpUser: { select: { id: true, name: true, image: true } },
      _count: { select: { mvpVotes: true, ratings: true } },
    },
  });

  return NextResponse.json(matches);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createMatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const match = await prisma.match.create({
    data: {
      date: new Date(parsed.data.date),
      opponent: parsed.data.opponent,
    },
  });

  return NextResponse.json(match, { status: 201 });
}
