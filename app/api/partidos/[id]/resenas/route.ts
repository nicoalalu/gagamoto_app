import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const resenas = await prisma.resena.findMany({
    where: { partidoId: id },
    include: { user: true },
  });
  return NextResponse.json(resenas);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const userId = (session.user as { id: string }).id;
  const { comentario } = await req.json();

  const resena = await prisma.resena.upsert({
    where: { partidoId_userId: { partidoId: id, userId } },
    update: { comentario: comentario ?? null },
    create: { partidoId: id, userId, comentario: comentario ?? null },
    include: { user: true },
  });
  return NextResponse.json(resena);
}
