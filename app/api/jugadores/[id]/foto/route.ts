import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: HandleUploadBody;
  try {
    body = await req.json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
        allowOverwrite: true,
      }),
      onUploadCompleted: async ({ blob }) => {
        // Pathname format: jugadores/{id}.{ext}
        const jugadorId = blob.pathname.replace(/^jugadores\//, "").replace(/\.[^.]+$/, "");

        // Delete previous blob
        const jugador = await prisma.jugador.findUnique({ where: { id: jugadorId }, select: { fotografia: true } });
        if (jugador?.fotografia && jugador.fotografia !== blob.url) {
          try { await del(jugador.fotografia); } catch {}
        }

        await prisma.jugador.update({
          where: { id: jugadorId },
          data: { fotografia: blob.url },
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[foto/route] handleUpload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
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
