import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Swords } from "lucide-react";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";

export default async function RivalesPage() {
  const session = await auth();
  if (!session) return null;

  const partidos = await prisma.partido.findMany({
    where: {
      jugado: true,
      OR: [{ equipo1: GAGAMOTO }, { equipo2: GAGAMOTO }],
    },
    orderBy: { fecha: "desc" },
  });

  // Group by rival
  const rivalesMap: Record<
    string,
    { pj: number; pg: number; pe: number; pp: number; gf: number; gc: number }
  > = {};

  for (const p of partidos) {
    const rival = p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1;
    if (!rivalesMap[rival]) rivalesMap[rival] = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
    const r = resultadoGagamoto(p);
    if (!r) continue;
    rivalesMap[rival].pj++;
    rivalesMap[rival].gf += r.gf;
    rivalesMap[rival].gc += r.gc;
    if (r.resultado === "G") rivalesMap[rival].pg++;
    else if (r.resultado === "E") rivalesMap[rival].pe++;
    else rivalesMap[rival].pp++;
  }

  const rivales = Object.entries(rivalesMap).sort((a, b) => b[1].pj - a[1].pj);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black flex items-center gap-2">
        <Swords className="text-[#0048FF]" size={24} />
        Rivales
      </h1>

      {rivales.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Swords size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Sin resultados registrados aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rivales.map(([nombre, s]) => (
            <Link
              key={nombre}
              href={`/rivales/${encodeURIComponent(nombre)}`}
              className="flex items-center justify-between rounded-xl px-4 py-3 border-2 border-black bg-white hover:bg-[#EEF3FF] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <div>
                <span className="font-bold">{nombre}</span>
                <span className="text-xs text-zinc-400 ml-2">{s.pj} PJ</span>
              </div>
              <div className="flex gap-3 text-sm font-semibold text-zinc-600">
                <span className="text-green-600">{s.pg}G</span>
                <span className="text-yellow-500">{s.pe}E</span>
                <span className="text-red-500">{s.pp}P</span>
                <span className="text-zinc-400">
                  {s.gf}-{s.gc}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
