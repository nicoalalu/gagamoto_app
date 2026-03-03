import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Trophy, Award, Calendar } from "lucide-react";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";

function Initials({ nombre, apellido }: { nombre: string; apellido: string }) {
  const ini = ((nombre[0] ?? "") + (apellido[0] ?? "")).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0 border border-gray-200">
      {ini}
    </div>
  );
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string }>;
}) {
  const { torneo: torneoId } = await searchParams;
  const session = await auth();
  if (!session) return null;

  const [torneos, partidos, jugadores, goles, tarjetas, calificaciones] =
    await Promise.all([
      prisma.torneo.findMany({ orderBy: { fechaInicio: "desc" } }),
      prisma.partido.findMany({
        where: {
          jugado: true,
          ...(torneoId ? { torneoId } : {}),
          OR: [{ equipo1: GAGAMOTO }, { equipo2: GAGAMOTO }],
        },
        orderBy: { fecha: "asc" },
        include: { mvpJugador: true },
      }),
      prisma.jugador.findMany({
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      }),
      prisma.gol.findMany({
        where: torneoId ? { partido: { torneoId } } : undefined,
        include: { jugador: true },
      }),
      prisma.tarjeta.findMany({
        where: torneoId ? { partido: { torneoId } } : undefined,
        include: { jugador: true },
      }),
      prisma.calificacion.findMany({
        where: torneoId ? { partido: { torneoId } } : undefined,
      }),
    ]);

  // ── Estadísticas del equipo ──────────────────────────────────────────────
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
  const pj = pg + pe + pp;
  const winRate = pj > 0 ? Math.round((pg / pj) * 100) : 0;
  const goalDiff = gf - gc;
  const goalsPerMatch = pj > 0 ? (gf / pj).toFixed(1) : "0.0";

  // ── Goles por jugador ────────────────────────────────────────────────────
  const golesMap: Record<
    string,
    { jugador: { id: string; nombre: string; apellido: string }; count: number }
  > = {};
  for (const g of goles) {
    if (!golesMap[g.jugadorId])
      golesMap[g.jugadorId] = { jugador: g.jugador, count: 0 };
    golesMap[g.jugadorId].count++;
  }
  const golesRanking = Object.values(golesMap).sort((a, b) => b.count - a.count);

  // ── Tarjetas por jugador ─────────────────────────────────────────────────
  const tarjetasMap: Record<string, { amarilla: number; roja: number }> = {};
  for (const t of tarjetas) {
    if (!tarjetasMap[t.jugadorId])
      tarjetasMap[t.jugadorId] = { amarilla: 0, roja: 0 };
    if (t.tipo === "AMARILLA") tarjetasMap[t.jugadorId].amarilla++;
    else tarjetasMap[t.jugadorId].roja++;
  }

  // ── MVPs por jugador ─────────────────────────────────────────────────────
  const mvpMap: Record<string, number> = {};
  for (const p of partidos) {
    if (p.mvpJugadorId)
      mvpMap[p.mvpJugadorId] = (mvpMap[p.mvpJugadorId] ?? 0) + 1;
  }

  // ── Rating promedio por jugador ──────────────────────────────────────────
  const ratingMap: Record<string, { sum: number; count: number }> = {};
  for (const c of calificaciones) {
    if (!ratingMap[c.jugadorId]) ratingMap[c.jugadorId] = { sum: 0, count: 0 };
    ratingMap[c.jugadorId].sum += c.puntaje;
    ratingMap[c.jugadorId].count++;
  }

  // ── PJ por jugador (partidos distintos en calificaciones) ────────────────
  const pjMap: Record<string, Set<string>> = {};
  for (const c of calificaciones) {
    if (!pjMap[c.jugadorId]) pjMap[c.jugadorId] = new Set();
    pjMap[c.jugadorId].add(c.partidoId);
  }

  // ── Ranking MVPs con rating ──────────────────────────────────────────────
  const mvpRanking = jugadores
    .filter((j) => (mvpMap[j.id] ?? 0) > 0)
    .map((j) => ({
      jugador: j,
      count: mvpMap[j.id] ?? 0,
      avgRating: ratingMap[j.id]
        ? (ratingMap[j.id].sum / ratingMap[j.id].count).toFixed(1)
        : null,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Tabla de todos los jugadores ─────────────────────────────────────────
  const allPlayersData = jugadores
    .map((j) => ({
      jugador: j,
      pj: pjMap[j.id]?.size ?? 0,
      goles: golesMap[j.id]?.count ?? 0,
      amarillas: tarjetasMap[j.id]?.amarilla ?? 0,
      rojas: tarjetasMap[j.id]?.roja ?? 0,
      mvp: mvpMap[j.id] ?? 0,
      avgRating: ratingMap[j.id]
        ? (ratingMap[j.id].sum / ratingMap[j.id].count).toFixed(1)
        : null,
    }))
    .sort((a, b) => b.pj - a.pj || b.goles - a.goles);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Rendimiento del equipo y jugadores
          </p>
        </div>

        {torneos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/estadisticas"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                !torneoId
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Todos
            </Link>
            {torneos.map((t) => (
              <Link
                key={t.id}
                href={`/estadisticas?torneo=${t.id}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  torneoId === t.id
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.nombre}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Resumen del equipo ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 text-base mb-6">
          Resumen del equipo
        </h2>

        {/* Stats principales */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-2 pb-6 border-b border-gray-100 text-center">
          <div>
            <p className="text-3xl font-black text-gray-900">{pj}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Jugados</p>
          </div>
          <div>
            <p className="text-3xl font-black text-green-500">{pg}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Victorias</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-500">{pe}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Empates</p>
          </div>
          <div>
            <p className="text-3xl font-black text-red-500">{pp}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Derrotas</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{gf}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Goles a favor</p>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900">{gc}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Goles en contra</p>
          </div>
        </div>

        {/* Stats secundarias */}
        <div className="grid grid-cols-3 gap-4 pt-5 text-center">
          <div>
            <p className="text-sm text-gray-400 font-medium">Efectividad</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{winRate}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Diferencia de gol</p>
            <p
              className={`text-2xl font-black mt-1 ${
                goalDiff > 0
                  ? "text-green-500"
                  : goalDiff < 0
                  ? "text-red-500"
                  : "text-gray-900"
              }`}
            >
              {goalDiff > 0 ? "+" : ""}
              {goalDiff}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Goles por partido</p>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {goalsPerMatch}
            </p>
          </div>
        </div>
      </div>

      {/* ── Goleadores ────────────────────────────────────────────────────── */}
      {golesRanking.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Trophy size={17} className="text-amber-500" />
            <h2 className="font-bold text-gray-900">Goleadores</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {golesRanking.slice(0, 5).map((g, i) => (
              <div
                key={g.jugador.id}
                className="flex items-center px-5 py-3.5 gap-4"
              >
                <span className="text-sm font-bold text-gray-300 w-7 shrink-0">
                  #{i + 1}
                </span>
                <Initials
                  nombre={g.jugador.nombre}
                  apellido={g.jugador.apellido}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {g.jugador.nombre} {g.jugador.apellido}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-gray-900">
                    {g.count}
                  </p>
                  <p className="text-xs text-gray-400">goles</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MVP Awards ────────────────────────────────────────────────────── */}
      {mvpRanking.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Award size={17} className="text-amber-500" />
            <h2 className="font-bold text-gray-900">MVP Awards</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {mvpRanking.map((m, i) => (
              <div
                key={m.jugador.id}
                className="flex items-center px-5 py-3.5 gap-4"
              >
                <span className="text-sm font-bold text-gray-300 w-7 shrink-0">
                  #{i + 1}
                </span>
                <Initials
                  nombre={m.jugador.nombre}
                  apellido={m.jugador.apellido}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {m.jugador.nombre} {m.jugador.apellido}
                  </p>
                  {m.avgRating && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Prom. rating: {m.avgRating}/10
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-amber-500">
                    {m.count}
                  </p>
                  <p className="text-xs text-gray-400">MVP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Todos los jugadores ───────────────────────────────────────────── */}
      {jugadores.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Todos los jugadores</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">
                    Jugador
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    <Calendar size={13} className="inline mb-0.5" />
                    <span className="sr-only">PJ</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    <Trophy size={13} className="inline mb-0.5" />
                    <span className="sr-only">Goles</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    <span
                      className="inline-block w-3 h-4 bg-yellow-400 rounded-sm align-middle"
                      title="Amarillas"
                    />
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    <span
                      className="inline-block w-3 h-4 bg-red-500 rounded-sm align-middle"
                      title="Rojas"
                    />
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    <Award size={13} className="inline mb-0.5 text-amber-400" />
                    <span className="sr-only">MVP</span>
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">Rating</th>
                </tr>
              </thead>
              <tbody>
                {allPlayersData.map((p) => (
                  <tr
                    key={p.jugador.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Initials
                          nombre={p.jugador.nombre}
                          apellido={p.jugador.apellido}
                        />
                        <span className="font-medium text-gray-900">
                          {p.jugador.nombre} {p.jugador.apellido}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {p.pj}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {p.goles}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {p.amarillas}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {p.rojas}
                    </td>
                    <td
                      className={`px-3 py-3 text-center font-semibold ${
                        p.mvp > 0 ? "text-amber-500" : "text-gray-300"
                      }`}
                    >
                      {p.mvp}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">
                      {p.avgRating ?? (
                        <span className="text-gray-300 font-normal">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
