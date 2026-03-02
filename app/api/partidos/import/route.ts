import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseCSV } from "@/lib/constants";

// POST /api/partidos/import  body: { torneoId, csv: string }
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { torneoId, csv } = body;

  if (!csv) return NextResponse.json({ error: "csv requerido" }, { status: 400 });

  const rows = parseCSV(csv);
  // Expected columns: Fecha, Equipo_1, Equipo_2, Horario, Lugar (optional)

  try {
    const created = await Promise.all(
      rows.map((row) => {
        const fechaStr = (row["Fecha"] || "").trim();
        const horarioStr = (row["Horario"] || "").trim();
        const equipo1 = (row["Equipo_1"] || row["equipo1"] || "").trim();
        const equipo2 = (row["Equipo_2"] || row["equipo2"] || "").trim();
        const lugar = (row["Lugar"] || row["lugar"] || "").trim() || null;

        if (!equipo1 || !equipo2) return null;

        let fecha: Date | null = null;
        if (fechaStr) {
          // Support DD/MM/YYYY, DD.MM.YYYY or YYYY-MM-DD
          const parts = fechaStr.split(/[\/\.]/); 
          if (parts.length === 3) {
            const [d, m, y] = parts.map((p) => p.padStart(2, "0"));
            fecha = new Date(`${y}-${m}-${d}T${horarioStr || "00:00"}:00`);
          } else {
            fecha = horarioStr ? new Date(`${fechaStr}T${horarioStr}:00`) : new Date(fechaStr);
          }
          // Reject invalid dates
          if (fecha && isNaN(fecha.getTime())) fecha = null;
        }

        return prisma.partido.create({
          data: {
            torneoId: torneoId || null,
            equipo1,
            equipo2,
            fecha,
            lugar,
          },
        });
      })
    );

    const valid = created.filter(Boolean);
    return NextResponse.json({ created: valid.length }, { status: 201 });
  } catch (err) {
    console.error("[import/partidos]", err);
    return NextResponse.json({ error: "Error al importar partidos" }, { status: 500 });
  }
}
