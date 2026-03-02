import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";

type Params = { params: Promise<{ nombre: string }> };

export default async function RivalDetallePage({ params }: Params) {
  const { nombre: nombreEncoded } = await params;
  const nombre = decodeURIComponent(nombreEncoded);
  const session = await auth();
  if (!session) return null;

  const partidos = await prisma.partido.findMany({
    where: {
      jugado: true,
      OR: [{ equipo1: nombre }, { equipo2: nombre }],
    },
    include: { torneo: true },
    orderBy: { fecha: "desc" },
  });

  if (partidos.length === 0) notFound();

  // Stats
  let pg = 0, pe = 0, pp = 0, gf = 0, gc = 0;
  for (const p of partidos) {
    const r = resultadoGagamoto(p);
    if (!r) continue;
    gf += r.gf;
    gc += r.gc;
    if (r.resultado === "G") pg++;
    else if (r.resultado === "E") pe++;
    else pp++;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/rivales" className="p-2 rounded-lg border-2 border-black hover:bg-zinc-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Swords className="text-[#0048FF]" size={22} />
          vs {nombre}
        </h1>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { label: "PJ", value: pg + pe + pp },
          { label: "PG", value: pg, color: "text-green-600" },
          { label: "PE", value: pe, color: "text-yellow-500" },
          { label: "PP", value: pp, color: "text-red-500" },
          { label: "GF-GC", value: `${gf}-${gc}` },
        ].map((k) => (
          <div key={k.label} className="border-2 border-black rounded-xl p-3 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className={`text-xl font-black ${k.color ?? ""}`}>{k.value}</div>
            <div className="text-xs text-zinc-400 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Historial */}
      <div>
        <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">
          Historial
        </h2>
        <div className="space-y-2">
          {partidos.map((p) => {
            const r = resultadoGagamoto(p);
            const badge =
              r?.resultado === "G"
                ? "bg-green-500 text-white"
                : r?.resultado === "E"
                ? "bg-yellow-400 text-black"
                : "bg-red-500 text-white";

            return (
              <Link
                key={p.id}
                href={`/fixture/${p.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 border-2 border-black bg-white hover:bg-[#EEF3FF] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {r && (
                    <span
                      className={`${badge} text-xs font-black w-7 h-7 flex items-center justify-center rounded-md`}
                    >
                      {r.resultado}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {p.equipo1} vs {p.equipo2}
                    </p>
                    {p.fecha && (
                      <p className="text-xs text-zinc-400">
                        {format(new Date(p.fecha), "dd/MM/yyyy", { locale: es })}
                        {p.torneo ? ` · ${p.torneo.nombre}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                {r && (
                  <span className="font-black">
                    {r.gf} - {r.gc}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
