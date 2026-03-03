import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { put, del } from "@vercel/blob";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `jugadores/${id}.${ext}`;

  // Delete previous blob if exists
  const jugador = await prisma.jugador.findUnique({ where: { id }, select: { fotografia: true } });
  if (jugador?.fotografia) {
    try { await del(jugador.fotografia); } catch {}
  }

  const blob = await put(filename, file, { access: "public", allowOverwrite: true });

  const updated = await prisma.jugador.update({
    where: { id },
    data: { fotografia: blob.url },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const jugador = await prisma.jugador.findUnique({ where: { id }, select: { fotografia: true } });

  if (jugador?.fotografia) {
    try { await del(jugador.fotografia); } catch {}
  }

  const updated = await prisma.jugador.update({
    where: { id },
    data: { fotografia: null },
  });

  return NextResponse.json(updated);
}
