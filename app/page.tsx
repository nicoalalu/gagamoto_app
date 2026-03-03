import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeStandings, resultadoGagamoto, GAGAMOTO } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Trophy, TrendingUp, Calendar, Award } from "lucide-react";
import AsistenciaBanner from "@/components/AsistenciaBanner";

export default async function HomePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  // Fetch all torneos and partidos
  const [torneos, allPartidos] = await Promise.all([
    prisma.torneo.findMany({ orderBy: { fechaInicio: "asc" } }),
    prisma.partido.findMany({
      orderBy: { fecha: "asc" },
      include: { torneo: true, asistencias: true, mvpJugador: true },
    }),
  ]);

  // Active torneo = latest one that started
  const today = new Date();
  const torneoActivo =
    torneos.find((t) => t.fechaInicio && new Date(t.fechaInicio) <= today) ??
    torneos[torneos.length - 1] ??
    null;

  const partidosTorneo = torneoActivo
    ? allPartidos.filter((p) => p.torneoId === torneoActivo.id)
    : allPartidos;

  // Standings
  const standings = computeStandings(
    partidosTorneo.filter((p) => p.jugado).map((p) => ({
      equipo1: p.equipo1,
      equipo2: p.equipo2,
      golesEquipo1: p.golesEquipo1,
      golesEquipo2: p.golesEquipo2,
    }))
  );

  const gagRow = standings.find((s) => s.nombre === GAGAMOTO);

  // KPI stats
  const matchesPlayed = gagRow?.pj ?? 0;
  const wins = gagRow?.pg ?? 0;
  const draws = gagRow?.pe ?? 0;
  const losses = gagRow?.pp ?? 0;
  const goalsScored = gagRow?.gf ?? 0;
  const goalsConceded = gagRow?.gc ?? 0;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  // Próximos partidos (jugado=false, fecha futura)
  const proximosPartidos = allPartidos
    .filter((p) => !p.jugado && isGagamoto(p) && p.fecha && new Date(p.fecha) >= today)
    .slice(0, 3);

  // Mi asistencia al primer próximo partido
  const proximoPartido = proximosPartidos[0] ?? null;
  const miAsistenciaObj =
    proximoPartido && userId
      ? proximoPartido.asistencias.find((a) => a.userId === userId) ?? null
      : null;
  const miAsistencia = miAsistenciaObj?.estado ?? null;

  // Últimos 3 partidos jugados por Gagamoto
  const ultimos3 = allPartidos
    .filter((p) => p.jugado && isGagamoto(p))
    .slice(-3)
    .reverse();

  // Partidos pasados sin resultado cargado
  const partidosSinResultado = allPartidos.filter(
    (p) => !p.jugado && isGagamoto(p) && p.fecha && new Date(p.fecha) < today
  );

  const bannerFecha = proximoPartido?.fecha
    ? format(new Date(proximoPartido.fecha), "EEEE d 'de' MMMM · HH:mm", { locale: es })
    : null;
  const bannerRival = proximoPartido
    ? (proximoPartido.equipo1 === GAGAMOTO ? proximoPartido.equipo2 : proximoPartido.equipo1)
    : null;

  return (
    <div className="space-y-6">
      {/* Banner asistencia próximo partido */}
      {proximoPartido && bannerRival && userId && miAsistencia === null && (
        <AsistenciaBanner
          partidoId={proximoPartido.id}
          rival={bannerRival}
          fecha={bannerFecha}
          lugar={proximoPartido.lugar ?? null}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {torneoActivo
            ? torneoActivo.nombre
            : "Resumen del rendimiento del equipo y próximos partidos"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Matches Played */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Partidos jugados</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{matchesPlayed}</p>
          </div>
          <div className="bg-blue-100 rounded-xl p-2.5">
            <Calendar className="text-blue-500" size={22} />
          </div>
        </div>

        {/* Wins */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Victorias</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{wins}</p>
            <p className="text-xs text-gray-400 mt-1">
              {draws} empates, {losses} derrotas
            </p>
          </div>
          <div className="bg-green-100 rounded-xl p-2.5">
            <Trophy className="text-green-500" size={22} />
          </div>
        </div>

        {/* Goals Scored */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Goles a favor</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{goalsScored}</p>
            <p className="text-xs text-gray-400 mt-1">{goalsConceded} en contra</p>
          </div>
          <div className="bg-yellow-100 rounded-xl p-2.5">
            <TrendingUp className="text-yellow-500" size={22} />
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Efectividad</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{winRate}%</p>
          </div>
          <div className="bg-purple-100 rounded-xl p-2.5">
            <Award className="text-purple-500" size={22} />
          </div>
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Upcoming Matches */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Próximos partidos</h2>
            <Link href="/partidos" className="text-sm text-amber-500 font-medium hover:text-amber-600">Ver todos</Link>
          </div>

          {proximosPartidos.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin partidos próximos</p>
          ) : (
            <div className="space-y-3">
              {proximosPartidos.map((p) => {
                const rival = p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1;
                return (
                  <Link
                    key={p.id}
                    href={`/partidos/${p.id}`}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{rival}</p>
                      {p.fecha && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(p.fecha), "MMM dd, yyyy · HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                    <span className="text-amber-500 font-bold text-sm">VS</span>
                  </Link>
                );
              })}
            </div>
          )}


        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Resultados recientes</h2>
              {partidosSinResultado.length > 0 && (
                <Link
                  href="/partidos"
                  title="Falta cargar resultados"
                  className="w-2 h-2 rounded-full bg-red-500 shrink-0 block"
                />
              )}
            </div>
            <Link href="/partidos" className="text-sm text-amber-500 font-medium hover:text-amber-600">
              Ver todos
            </Link>
          </div>

          {ultimos3.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Sin resultados aún</p>
          ) : (
            <div className="space-y-3">
              {ultimos3.map((p) => {
                const r = resultadoGagamoto(p);
                const rival = p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1;
                const badgeStyle =
                  r?.resultado === "G"
                    ? "bg-green-500 text-white"
                    : r?.resultado === "E"
                    ? "bg-gray-400 text-white"
                    : "bg-red-500 text-white";
                const badgeLabel =
                  r?.resultado === "G" ? "Victoria" : r?.resultado === "E" ? "Empate" : "Derrota";
                return (
                  <Link
                    key={p.id}
                    href={`/partidos/${p.id}`}
                    className="flex flex-col bg-gray-50 rounded-xl px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">{rival}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {r ? `${r.gf} - ${r.gc}` : "-"}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {p.fecha && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(p.fecha), "MMM dd, yyyy", { locale: es })}
                        </span>
                      )}
                      {p.mvpJugador && (
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <Award size={11} />
                          MVP: {p.mvpJugador.nombre}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de posiciones */}
      {standings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tabla de posiciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  {["#", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "Pts"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr
                    key={s.nombre}
                    className={`border-t border-gray-100 ${
                      s.nombre === GAGAMOTO
                        ? "bg-amber-50 font-semibold"
                        : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {s.nombre === GAGAMOTO ? (
                        s.nombre
                      ) : (
                        <Link
                          href={`/rivales?rival=${encodeURIComponent(s.nombre)}`}
                          className="hover:text-amber-600 hover:underline transition-colors"
                        >
                          {s.nombre}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.pj}</td>
                    <td className="px-4 py-3 text-gray-600">{s.pg}</td>
                    <td className="px-4 py-3 text-gray-600">{s.pe}</td>
                    <td className="px-4 py-3 text-gray-600">{s.pp}</td>
                    <td className="px-4 py-3 text-gray-600">{s.gf}</td>
                    <td className="px-4 py-3 text-gray-600">{s.gc}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{s.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!torneoActivo && standings.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <Trophy size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Todavía no hay torneos cargados</p>
          <p className="text-sm mt-1">
            <Link href="/admin/torneo" className="text-[#0048FF] underline">
              Ir al Admin
            </Link>{" "}
            para importar el fixture.
          </p>
        </div>
      )}
    </div>
  );
}

function isGagamoto(p: { equipo1: string; equipo2: string }) {
  return p.equipo1 === GAGAMOTO || p.equipo2 === GAGAMOTO;
}

