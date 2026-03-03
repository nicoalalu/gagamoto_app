import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string }>;
}) {
  const { torneo: torneoId } = await searchParams;
  const session = await auth();
  if (!session) return null;

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const today = new Date();

  const [torneos, partidos] = await Promise.all([
    prisma.torneo.findMany({ orderBy: { fechaInicio: "desc" } }),
    prisma.partido.findMany({
      where: torneoId ? { torneoId } : undefined,
      orderBy: { fecha: "asc" },
      include: { torneo: true, asistencias: true },
    }),
  ]);

  // Group by date string (YYYY-MM-DD)
  const grouped = new Map<string, typeof partidos>();
  for (const p of partidos) {
    const key = p.fecha
      ? format(new Date(p.fecha), "yyyy-MM-dd")
      : "sin-fecha";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixture</h1>
          <p className="text-sm text-gray-500 mt-0.5">Calendario de partidos del torneo</p>
        </div>

        {torneos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/fixture"
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
                href={`/fixture?torneo=${t.id}`}
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

      {partidos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No hay partidos cargados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateKey, grupo]) => {
            const fechaLabel =
              dateKey === "sin-fecha"
                ? "Sin fecha"
                : format(new Date(dateKey + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es });

            return (
              <div key={dateKey}>
                {/* Date header */}
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 px-1 capitalize">
                  {fechaLabel}
                </h2>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {grupo.map((p, idx) => {
                    const esNuestro = p.equipo1 === GAGAMOTO || p.equipo2 === GAGAMOTO;
                    const rival = p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1;
                    const r = esNuestro ? resultadoGagamoto(p) : null;
                    const sinResultado = !p.jugado && p.fecha && new Date(p.fecha) < today;

                    const asistencia = userId
                      ? p.asistencias.find((a) => a.userId === userId)?.estado ?? null
                      : null;

                    const resultBadge =
                      r?.resultado === "G"
                        ? { style: "bg-green-500 text-white", label: "WIN" }
                        : r?.resultado === "E"
                        ? { style: "bg-gray-400 text-white", label: "DRAW" }
                        : r?.resultado === "P"
                        ? { style: "bg-red-500 text-white", label: "LOSS" }
                        : null;

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between px-5 py-4 gap-4 ${
                          idx !== 0 ? "border-t border-gray-100" : ""
                        } ${esNuestro ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        {/* Left: match info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-semibold text-sm ${esNuestro ? "text-gray-900" : "text-gray-500"}`}>
                              {esNuestro ? `vs ${rival}` : `${p.equipo1} vs ${p.equipo2}`}
                            </span>
                            {sinResultado && (
                              <span
                                title="Falta cargar resultados"
                                className="w-2 h-2 rounded-full bg-red-500 shrink-0 inline-block"
                              />
                            )}
                            {resultBadge && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resultBadge.style}`}>
                                {resultBadge.label}
                              </span>
                            )}
                            {p.jugado && (
                              r ? (
                                <span className="text-sm font-bold text-gray-700">
                                  {r.gf} - {r.gc}
                                </span>
                              ) : p.golesEquipo1 !== null ? (
                                <span className="text-sm font-bold text-gray-500">
                                  {p.golesEquipo1} - {p.golesEquipo2}
                                </span>
                              ) : null
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {p.fecha && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar size={11} />
                                {format(new Date(p.fecha), "MMM dd, yyyy · HH:mm", { locale: es })}
                              </span>
                            )}
                            {esNuestro && !p.jugado && asistencia === "SI" && (
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                <CheckCircle size={12} />
                                Attending
                              </span>
                            )}
                            {esNuestro && !p.jugado && asistencia === "NO" && (
                              <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <XCircle size={12} />
                                Not attending
                              </span>
                            )}
                            {esNuestro && !p.jugado && asistencia === null && (
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                                <Clock size={12} />
                                Sin confirmar
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: action */}
                        <Link
                          href={`/fixture/${p.id}`}
                          className="shrink-0 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-1.5 rounded-lg"
                        >
                          Ver detalles
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
