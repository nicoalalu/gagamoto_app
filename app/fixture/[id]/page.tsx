import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Calendar, Award, Trophy, CheckCircle, XCircle } from "lucide-react";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export default async function PartidoPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return null;

  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      torneo: true,
      goles: { include: { jugador: true }, orderBy: { minuto: "asc" } },
      tarjetas: { include: { jugador: true }, orderBy: { minuto: "asc" } },
      asistencias: { include: { user: true } },
      votos: { include: { jugador: true } },
      mvpJugador: true,
    },
  });

  if (!partido) notFound();

  const r = resultadoGagamoto(partido);
  const esNuestro = partido.equipo1 === GAGAMOTO || partido.equipo2 === GAGAMOTO;
  const rival = partido.equipo1 === GAGAMOTO ? partido.equipo2 : partido.equipo1;

  // MVP by votes fallback
  const voteCount: Record<string, number> = {};
  partido.votos.forEach((v) => {
    voteCount[v.jugadorId] = (voteCount[v.jugadorId] ?? 0) + 1;
  });
  const mvpVotado = partido.votos.reduce(
    (top, v) => {
      const count = voteCount[v.jugadorId] ?? 0;
      return !top || count > (voteCount[top.jugadorId] ?? 0) ? v : top;
    },
    null as (typeof partido.votos)[0] | null
  );
  const mvp = partido.mvpJugador ?? mvpVotado?.jugador ?? null;

  const presentes = partido.asistencias.filter((a) => a.estado === "SI");
  const ausentes = partido.asistencias.filter((a) => a.estado === "NO");

  const resultBadge = esNuestro
    ? r?.resultado === "G"
      ? { style: "bg-green-500 text-white", label: "WIN" }
      : r?.resultado === "E"
      ? { style: "bg-gray-200 text-gray-700", label: "DRAW" }
      : r?.resultado === "P"
      ? { style: "bg-red-500 text-white", label: "LOSS" }
      : null
    : null;

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link
        href="/fixture"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al fixture
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Score row */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {esNuestro ? `vs ${rival}` : `${partido.equipo1} vs ${partido.equipo2}`}
            </h1>
            {partido.fecha && (
              <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                <Calendar size={13} />
                {format(new Date(partido.fecha), "MMMM d, yyyy · HH:mm", { locale: es })}
              </p>
            )}
          </div>
          <div className="text-right">
            {partido.jugado && partido.golesEquipo1 !== null ? (
              <>
                <div className="text-4xl font-black text-gray-900 leading-none">
                  {partido.golesEquipo1} - {partido.golesEquipo2}
                </div>
                {resultBadge && (
                  <span className={`inline-block mt-1.5 text-xs font-bold px-3 py-1 rounded-full ${resultBadge.style}`}>
                    {resultBadge.label}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                Pendiente
              </span>
            )}
          </div>
        </div>

        {/* MVP */}
        {mvp && (
          <>
            <div className="h-px bg-gray-100 mx-6" />
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Award size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Match MVP</p>
                <p className="font-bold text-gray-900">
                  {mvp.nombre} {mvp.apellido}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stats + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Match Statistics */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Match Statistics</h2>

          {partido.goles.length === 0 && partido.tarjetas.length === 0 ? (
            <p className="text-sm text-gray-400">Sin estadísticas registradas</p>
          ) : (
            <div className="space-y-5">
              {/* Goals */}
              {partido.goles.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-2">Goals</p>
                  <ul className="space-y-2">
                    {partido.goles.map((g) => (
                      <li key={g.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <Trophy size={15} className="text-amber-500 shrink-0" />
                        <span className="font-medium">
                          {g.jugador.nombre} {g.jugador.apellido}
                        </span>
                        {g.minuto && (
                          <span className="text-gray-400 text-xs">{g.minuto}&apos;</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cards */}
              {partido.tarjetas.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-2">Cards</p>
                  <ul className="space-y-2">
                    {partido.tarjetas.map((t) => (
                      <li key={t.id} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <span
                          className={`w-3.5 h-4.5 rounded-sm shrink-0 inline-block ${
                            t.tipo === "AMARILLA" ? "bg-yellow-400" : "bg-red-600"
                          }`}
                          style={{ minWidth: "0.875rem", height: "1.125rem" }}
                        />
                        <span className="font-medium">
                          {t.jugador.nombre} {t.jugador.apellido}
                        </span>
                        {t.minuto && (
                          <span className="text-gray-400 text-xs">{t.minuto}&apos;</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-5">Attendance</h2>

          {presentes.length === 0 && ausentes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No attendance responses yet</p>
          ) : (
            <div className="space-y-4">
              {presentes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Attending ({presentes.length})
                  </p>
                  <ul className="space-y-1.5">
                    {presentes.map((a) => (
                      <li key={a.id} className="text-sm text-gray-700">{a.user.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {ausentes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                    <XCircle size={12} /> Not attending ({ausentes.length})
                  </p>
                  <ul className="space-y-1.5">
                    {ausentes.map((a) => (
                      <li key={a.id} className="text-sm text-gray-400">{a.user.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
