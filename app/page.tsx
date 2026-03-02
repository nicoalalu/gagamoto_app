import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { computeStandings, resultadoGagamoto, GAGAMOTO } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Trophy, TrendingUp, Calendar } from "lucide-react";
import AsistenciaButton from "@/components/AsistenciaButton";

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

  const gagPos = standings.findIndex((s) => s.nombre === GAGAMOTO) + 1;
  const gagRow = standings.find((s) => s.nombre === GAGAMOTO);

  // Próximo partido (jugado=false, fecha futura)
  const proximoPartido = allPartidos.find(
    (p) =>
      !p.jugado &&
      isGagamoto(p) &&
      p.fecha &&
      new Date(p.fecha) >= today
  ) ?? null;

  // Mi asistencia al próximo partido
  const miAsistencia = proximoPartido && userId
    ? proximoPartido.asistencias.find((a) => a.userId === userId)?.estado ?? null
    : null;

  // Últimos 5 partidos jugados por Gagamoto
  const ultimos5 = allPartidos
    .filter((p) => p.jugado && isGagamoto(p))
    .slice(-5)
    .reverse();

  // Rival del próximo partido
  const proximoRival = proximoPartido
    ? proximoPartido.equipo1 === GAGAMOTO
      ? proximoPartido.equipo2
      : proximoPartido.equipo1
    : null;
  const proximoPosRival = standings.findIndex((s) => s.nombre === proximoRival) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="text-[#0048FF]" size={24} />
            Inicio
          </h1>
          {torneoActivo && (
            <p className="text-sm text-zinc-500 mt-0.5">{torneoActivo.nombre}</p>
          )}
        </div>
      </div>

      {/* KPI strip */}
      {gagRow && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Posición", value: gagPos ? `${gagPos}°` : "-" },
            { label: "Ganados", value: gagRow.pg },
            { label: "Empatados", value: gagRow.pe },
            { label: "Perdidos", value: gagRow.pp },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-[#0048FF] text-white rounded-xl p-4 text-center border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="text-2xl font-black">{k.value}</div>
              <div className="text-xs font-medium opacity-80">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Próximo partido */}
      {proximoPartido && (
        <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Calendar size={14} /> Próximo partido
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xl font-black">
                {proximoPartido.equipo1} <span className="text-zinc-400">vs</span>{" "}
                {proximoPartido.equipo2}
              </div>
              {proximoPartido.fecha && (
                <div className="text-sm text-zinc-500 mt-0.5">
                  {format(new Date(proximoPartido.fecha), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                  {proximoPartido.lugar ? ` · ${proximoPartido.lugar}` : ""}
                </div>
              )}
              {proximoRival && proximoPosRival > 0 && (
                <div className="text-xs text-zinc-400 mt-0.5">
                  Rival posición {proximoPosRival}° en tabla
                </div>
              )}
            </div>
            {userId && (
              <AsistenciaButton
                partidoId={proximoPartido.id}
                initialEstado={miAsistencia as "SI" | "NO" | null}
              />
            )}
          </div>
        </div>
      )}

      {/* Últimos 5 */}
      {ultimos5.length > 0 && (
        <div>
          <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1">
            <TrendingUp size={14} /> Últimos resultados
          </h2>
          <div className="space-y-2">
            {ultimos5.map((p) => {
              const r = resultadoGagamoto(p);
              const rival = p.equipo1 === GAGAMOTO ? p.equipo2 : p.equipo1;
              const color =
                r?.resultado === "G"
                  ? "bg-green-50 border-green-300"
                  : r?.resultado === "E"
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-red-50 border-red-300";
              const badge =
                r?.resultado === "G"
                  ? "bg-green-500"
                  : r?.resultado === "E"
                  ? "bg-yellow-400"
                  : "bg-red-500";
              return (
                <Link
                  key={p.id}
                  href={`/fixture/${p.id}`}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 border ${color} hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${badge} text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded`}
                    >
                      {r?.resultado}
                    </span>
                    <span className="font-semibold text-sm">vs {rival}</span>
                  </div>
                  <div className="text-sm font-bold">
                    {r ? `${r.gf} - ${r.gc}` : "-"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla de posiciones */}
      {standings.length > 0 && (
        <div>
          <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wider mb-3">
            Tabla de posiciones
          </h2>
          <div className="overflow-x-auto rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <table className="w-full text-sm">
              <thead className="bg-[#0048FF] text-white">
                <tr>
                  {["#", "Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "Pts"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr
                    key={s.nombre}
                    className={`border-t border-zinc-200 ${
                      s.nombre === GAGAMOTO ? "bg-[#EEF3FF] font-bold" : i % 2 === 0 ? "bg-white" : "bg-zinc-50"
                    } ${s.nombre === proximoRival ? "ring-1 ring-inset ring-[#0048FF]" : ""}`}
                  >
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold">{s.nombre}</td>
                    <td className="px-3 py-2">{s.pj}</td>
                    <td className="px-3 py-2">{s.pg}</td>
                    <td className="px-3 py-2">{s.pe}</td>
                    <td className="px-3 py-2">{s.pp}</td>
                    <td className="px-3 py-2">{s.gf}</td>
                    <td className="px-3 py-2">{s.gc}</td>
                    <td className="px-3 py-2 font-black">{s.pts}</td>
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

