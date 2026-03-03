import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { del } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

type Params = { params: Promise<{ id: string }> };

// Token generation + completion callback
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
        maximumSizeInBytes: 10 * 1024 * 1024,
        allowOverwrite: true,
      }),
      onUploadCompleted: async ({ blob }) => {
        const equipoId = blob.pathname.replace(/^equipos\//, "").replace(/\.[^.]+$/, "");
        const equipo = await prisma.equipo.findUnique({ where: { id: equipoId }, select: { logo: true } });
        if (equipo?.logo && equipo.logo !== blob.url) {
          try { await del(equipo.logo); } catch {}
        }
        await prisma.equipo.update({ where: { id: equipoId }, data: { logo: blob.url } });
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[equipos/logo] handleUpload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

// Save URL from client (reliable, doesn't depend on webhook)
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { url } = await req.json() as { url: string };
  if (!url) return NextResponse.json({ error: "No url" }, { status: 400 });

  const equipo = await prisma.equipo.findUnique({ where: { id }, select: { logo: true } });
  if (equipo?.logo && equipo.logo !== url) {
    try { await del(equipo.logo); } catch {}
  }

  const updated = await prisma.equipo.update({ where: { id }, data: { logo: url } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const equipo = await prisma.equipo.findUnique({ where: { id }, select: { logo: true } });
  if (equipo?.logo) {
    try { await del(equipo.logo); } catch {}
  }
  const updated = await prisma.equipo.update({ where: { id }, data: { logo: null } });
  return NextResponse.json(updated);
}
