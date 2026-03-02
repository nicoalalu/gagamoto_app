import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/constants";

// POST /api/jugadores/import  body: { csv: string }
// Expected CSV columns: Nombre, Apellido, Numero_de_camiseta
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "csv requerido" }, { status: 400 });

  const rows = parseCSV(csv);
  const results = await Promise.allSettled(
    rows.map((row) => {
      const nombre = (row["Nombre"] || row["nombre"] || "").trim();
      const apellido = (row["Apellido"] || row["apellido"] || "").trim();
      const numStr = (row["Numero_de_camiseta"] || row["numero_de_camiseta"] || "").trim();
      if (!nombre || !apellido) return Promise.resolve(null);

      return prisma.jugador.upsert({
        where: { nombre_apellido: { nombre, apellido } },
        update: { numeroCamiseta: numStr ? Number(numStr) : null },
        create: { nombre, apellido, numeroCamiseta: numStr ? Number(numStr) : null },
      });
    })
  );

  const created = results.filter((r) => r.status === "fulfilled" && r.value !== null).length;
  return NextResponse.json({ created }, { status: 201 });
}
