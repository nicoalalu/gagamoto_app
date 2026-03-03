import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Swords, Calendar, Award, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GAGAMOTO, computeStandings } from "@/lib/constants";
import RivalSelector from "@/components/RivalSelector";

export default async function RivalesPage({
  searchParams,
}: {
  searchParams: Promise<{ rival?: string }>;
}) {
  const { rival: rivalSeleccionado } = await searchParams;
  const session = await auth();
  if (!session) return null;

  // Fetch everything we need
  const [torneos, todosPartidos] = await Promise.all([
    prisma.torneo.findMany({ orderBy: { fechaInicio: "asc" } }),
    prisma.partido.findMany({
      orderBy: { fecha: "asc" },
      include: { torneo: true },
    }),
  ]);

  // Active torneo for standings
  const today = new Date();
  const torneoActivo =
    torneos.find((t) => t.fechaInicio && new Date(t.fechaInicio) <= today) ??
    torneos[torneos.length - 1] ??
    null;

  const partidosTorneo = torneoActivo
    ? todosPartidos.filter((p) => p.torneoId === torneoActivo.id)
    : todosPartidos;

  // Standings for position lookup
  const standings = computeStandings(
    partidosTorneo.filter((p) => p.jugado).map((p) => ({
      equipo1: p.equipo1,
      equipo2: p.equipo2,
      golesEquipo1: p.golesEquipo1,
      golesEquipo2: p.golesEquipo2,
    }))
  );

  // All H2H matches (played, involving GAGAMOTO)
  const h2hTodos = todosPartidos.filter(
    (p) => p.jugado && (p.equipo1 === GAGAMOTO || p.equipo2 === GAGAMOTO)
  );

  // Unique rivals sorted alphabetically
  const rivalesSet = new Set<string>();
  for (const p of h2hTodos) {
    rivalesSet.add(p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1);
  }
  // Also include rivals with upcoming (not yet played) matches
  for (const p of todosPartidos) {
    if (p.equipo1 === GAGAMOTO || p.equipo2 === GAGAMOTO) {
      rivalesSet.add(p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1);
    }
  }
  const rivales = Array.from(rivalesSet).sort();

  // Full match history of selected rival
  const historialRival = rivalSeleccionado
    ? todosPartidos
        .filter(
          (p) =>
            p.jugado &&
            (p.equipo1 === rivalSeleccionado || p.equipo2 === rivalSeleccionado)
        )
        .sort((a, b) => (b.fecha?.getTime() ?? 0) - (a.fecha?.getTime() ?? 0))
    : [];

  // Rival's OVERALL stats in the tournament (from standings)
  const rivalPos = rivalSeleccionado
    ? standings.findIndex((s) => s.nombre === rivalSeleccionado) + 1
    : 0;
  const rivalStanding = rivalSeleccionado
    ? standings.find((s) => s.nombre === rivalSeleccionado)
    : null;

  const pj = rivalStanding?.pj ?? 0;
  const pg = rivalStanding?.pg ?? 0;
  const pe = rivalStanding?.pe ?? 0;
  const pp = rivalStanding?.pp ?? 0;
  const gf = rivalStanding?.gf ?? 0;
  const gc = rivalStanding?.gc ?? 0;
  const winRate = pj > 0 ? Math.round((pg / pj) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rivales</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Estadísticas de cada equipo en el torneo
        </p>
      </div>

      {/* Selector */}
      {rivales.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Swords size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">Sin partidos registrados aún</p>
        </div>
      ) : (
        <RivalSelector rivales={rivales} selected={rivalSeleccionado ?? null} />
      )}

      {/* Stats for selected rival */}
      {rivalSeleccionado && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Partidos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pj}</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-2.5">
                <Calendar className="text-blue-500" size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Victorias</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{pg}</p>
                <p className="text-xs text-gray-400 mt-1">{pe}E · {pp}P</p>
              </div>
              <div className="bg-green-100 rounded-xl p-2.5">
                <TrendingUp className="text-green-500" size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Goles</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{gf}</p>
                <p className="text-xs text-gray-400 mt-1">{gc} en contra</p>
              </div>
              <div className="bg-yellow-100 rounded-xl p-2.5">
                <Swords className="text-yellow-500" size={20} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  {rivalPos > 0 ? "Posición en tabla" : "Efectividad"}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {rivalPos > 0 ? `${rivalPos}°` : `${winRate}%`}
                </p>
                {rivalStanding && (
                  <p className="text-xs text-gray-400 mt-1">{rivalStanding.pts} pts</p>
                )}
              </div>
              <div className="bg-purple-100 rounded-xl p-2.5">
                <Award className="text-purple-500" size={20} />
              </div>
            </div>
          </div>

          {/* Match history */}
          {historialRival.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
              Sin partidos jugados
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">
                  Historial completo
                </h2>
              </div>
              {historialRival.map((p, idx) => {
                const esEquipo1 = p.equipo1 === rivalSeleccionado;
                const rival = esEquipo1 ? p.equipo2 : p.equipo1;
                const gf = esEquipo1 ? p.golesEquipo1 : p.golesEquipo2;
                const gc = esEquipo1 ? p.golesEquipo2 : p.golesEquipo1;
                const resultado =
                  gf === null || gc === null
                    ? null
                    : gf > gc
                    ? "G"
                    : gf < gc
                    ? "P"
                    : "E";
                const resultBadge =
                  resultado === "G"
                    ? { style: "bg-green-500 text-white", label: "WIN" }
                    : resultado === "E"
                    ? { style: "bg-gray-200 text-gray-700", label: "DRAW" }
                    : { style: "bg-red-500 text-white", label: "LOSS" };

                return (
                  <Link
                    key={p.id}
                    href={`/partidos/${p.id}`}
                    className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                      idx !== 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">
                          vs {rival}
                        </span>
                        {resultado && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultBadge.style}`}>
                            {resultBadge.label}
                          </span>
                        )}
                        {gf !== null && gc !== null && (
                          <span className="font-bold text-sm text-gray-700">
                            {gf} - {gc}
                          </span>
                        )}
                      </div>
                      {p.fecha && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Calendar size={11} />
                          {format(new Date(p.fecha), "MMM dd, yyyy · HH:mm", { locale: es })}
                          {p.torneo ? ` · ${p.torneo.nombre}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-medium shrink-0 ml-4">
                      Ver detalles →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Placeholder when nothing selected */}
      {!rivalSeleccionado && rivales.length > 0 && (
        <div className="text-center py-12 text-gray-400">
          <Swords size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Seleccioná un rival para ver las estadísticas</p>
        </div>
      )}
    </div>
  );
}
