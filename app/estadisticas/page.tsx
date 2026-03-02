import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string }>;
}) {
  const { torneo: torneoId } = await searchParams;
  const session = await auth();
  if (!session) return null;

  const [torneos, partidos, jugadores, goles, tarjetas] = await Promise.all([
    prisma.torneo.findMany({ orderBy: { fechaInicio: "desc" } }),
    prisma.partido.findMany({
      where: {
        jugado: true,
        ...(torneoId ? { torneoId } : {}),
        OR: [{ equipo1: GAGAMOTO }, { equipo2: GAGAMOTO }],
      },
      orderBy: { fecha: "asc" },
    }),
    prisma.jugador.findMany({ orderBy: [{ apellido: "asc" }] }),
    prisma.gol.findMany({
      where: torneoId
        ? { partido: { torneoId } }
        : undefined,
      include: { jugador: true, partido: true },
    }),
    prisma.tarjeta.findMany({
      where: torneoId
        ? { partido: { torneoId } }
        : undefined,
      include: { jugador: true },
    }),
  ]);

  // Aggregate goles per jugador
  const golesMap: Record<string, { jugador: { nombre: string; apellido: string }; count: number }> = {};
  for (const g of goles) {
    const key = g.jugadorId;
    if (!golesMap[key]) golesMap[key] = { jugador: g.jugador, count: 0 };
    golesMap[key].count++;
  }
  const golesRanking = Object.values(golesMap).sort((a, b) => b.count - a.count);

  // Aggregate tarjetas per jugador
  const tarjetasMap: Record<
    string,
    { jugador: { nombre: string; apellido: string }; amarilla: number; roja: number }
  > = {};
  for (const t of tarjetas) {
    const key = t.jugadorId;
    if (!tarjetasMap[key]) tarjetasMap[key] = { jugador: t.jugador, amarilla: 0, roja: 0 };
    if (t.tipo === "AMARILLA") tarjetasMap[key].amarilla++;
    else tarjetasMap[key].roja++;
  }
  const tarjetasRanking = Object.values(tarjetasMap).sort(
    (a, b) => b.amarilla + b.roja * 2 - (a.amarilla + a.roja * 2)
  );

  // Global team stats
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BarChart2 className="text-[#0048FF]" size={24} />
          Estadísticas
        </h1>

        {torneos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/estadisticas"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-black transition-colors ${
                !torneoId ? "bg-[#0048FF] text-white" : "bg-white hover:bg-zinc-100"
              }`}
            >
              Todos
            </Link>
            {torneos.map((t) => (
              <Link
                key={t.id}
                href={`/estadisticas?torneo=${t.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-black transition-colors ${
                  torneoId === t.id
                    ? "bg-[#0048FF] text-white"
                    : "bg-white hover:bg-zinc-100"
                }`}
              >
                {t.nombre}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Team KPIs */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goleadores */}
        {golesRanking.length > 0 && (
          <div className="border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#0048FF] text-white px-4 py-2 font-bold text-sm">
              ⚽ Goleadores
            </div>
            <ul className="divide-y divide-zinc-100">
              {golesRanking.slice(0, 10).map((g, i) => (
                <li key={g.jugador.apellido + g.jugador.nombre} className="flex items-center px-4 py-2.5 gap-3">
                  <span className="text-sm font-bold text-zinc-400 w-5">{i + 1}</span>
                  <span className="flex-1 font-semibold text-sm">
                    {g.jugador.nombre} {g.jugador.apellido}
                  </span>
                  <span className="font-black text-[#0048FF]">{g.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tarjetas */}
        {tarjetasRanking.length > 0 && (
          <div className="border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-zinc-800 text-white px-4 py-2 font-bold text-sm">
              🟨 Disciplina
            </div>
            <ul className="divide-y divide-zinc-100">
              {tarjetasRanking.slice(0, 10).map((t) => (
                <li key={t.jugador.apellido + t.jugador.nombre} className="flex items-center px-4 py-2.5 gap-3">
                  <span className="flex-1 font-semibold text-sm">
                    {t.jugador.nombre} {t.jugador.apellido}
                  </span>
                  <div className="flex gap-2 text-xs font-bold">
                    {t.amarilla > 0 && (
                      <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded">
                        {t.amarilla}🟨
                      </span>
                    )}
                    {t.roja > 0 && (
                      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded">
                        {t.roja}🟥
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Jugadores */}
      {jugadores.length > 0 && (
        <div className="border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-zinc-100 px-4 py-2 font-bold text-sm text-zinc-600">
            👥 Plantel ({jugadores.length})
          </div>
          <div className="divide-y divide-zinc-100">
            {jugadores.map((j) => (
              <div key={j.id} className="flex items-center px-4 py-2.5 gap-3">
                {j.numeroCamiseta !== null && (
                  <span className="w-8 h-8 rounded-full bg-[#0048FF] text-white text-xs flex items-center justify-center font-black">
                    {j.numeroCamiseta}
                  </span>
                )}
                <span className="font-semibold text-sm">
                  {j.nombre} {j.apellido}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
