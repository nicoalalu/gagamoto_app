import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
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

  // MVP by votes
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

  const presentes = partido.asistencias.filter((a) => a.estado === "SI");
  const ausentes = partido.asistencias.filter((a) => a.estado === "NO");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fixture" className="p-2 rounded-lg border-2 border-black hover:bg-zinc-100">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black">
            {partido.equipo1} vs {partido.equipo2}
          </h1>
          {partido.torneo && (
            <p className="text-xs text-zinc-400">{partido.torneo.nombre}</p>
          )}
        </div>
      </div>

      {/* Score */}
      <div
        className={`rounded-xl p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center ${
          esNuestro && r
            ? r.resultado === "G"
              ? "bg-green-50"
              : r.resultado === "E"
              ? "bg-yellow-50"
              : "bg-red-50"
            : "bg-white"
        }`}
      >
        {partido.jugado && partido.golesEquipo1 !== null ? (
          <div className="text-5xl font-black">
            {partido.golesEquipo1} – {partido.golesEquipo2}
          </div>
        ) : (
          <div className="text-lg font-semibold text-zinc-400">Pendiente</div>
        )}
        {partido.fecha && (
          <p className="text-sm text-zinc-500 mt-2">
            {format(new Date(partido.fecha), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
            {partido.lugar ? ` · ${partido.lugar}` : ""}
          </p>
        )}
      </div>

      {/* MVP */}
      {(partido.mvpJugador || mvpVotado) && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center gap-3">
          <Star size={20} className="text-yellow-500 fill-yellow-500 shrink-0" />
          <div>
            <p className="text-xs uppercase font-bold text-yellow-600 tracking-wider">MVP</p>
            <p className="font-black text-lg">
              {partido.mvpJugador
                ? `${partido.mvpJugador.nombre} ${partido.mvpJugador.apellido}`
                : mvpVotado
                ? `${mvpVotado.jugador.nombre} ${mvpVotado.jugador.apellido}`
                : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goles */}
        {partido.goles.length > 0 && (
          <div className="border-2 border-black rounded-xl p-4 bg-white">
            <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">
              Goles
            </h2>
            <ul className="space-y-1.5">
              {partido.goles.map((g) => (
                <li key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="text-base">⚽</span>
                  <span className="font-semibold">
                    {g.jugador.nombre} {g.jugador.apellido}
                  </span>
                  {g.minuto && (
                    <span className="text-zinc-400 text-xs">{g.minuto}&apos;</span>
                  )}
                  {g.equipo && (
                    <span className="text-xs text-zinc-400">({g.equipo})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tarjetas */}
        {partido.tarjetas.length > 0 && (
          <div className="border-2 border-black rounded-xl p-4 bg-white">
            <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">
              Tarjetas
            </h2>
            <ul className="space-y-1.5">
              {partido.tarjetas.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`w-4 h-5 rounded-sm ${
                      t.tipo === "AMARILLA" ? "bg-yellow-400" : "bg-red-600"
                    }`}
                  />
                  <span className="font-semibold">
                    {t.jugador.nombre} {t.jugador.apellido}
                  </span>
                  {t.minuto && (
                    <span className="text-zinc-400 text-xs">{t.minuto}&apos;</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Asistencia */}
      {(presentes.length > 0 || ausentes.length > 0) && (
        <div className="border-2 border-black rounded-xl p-4 bg-white">
          <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">
            Asistencia
          </h2>
          <div className="flex gap-6 flex-wrap">
            {presentes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-green-600 mb-1">✓ Presentes ({presentes.length})</p>
                <ul className="space-y-0.5">
                  {presentes.map((a) => (
                    <li key={a.id} className="text-sm">{a.user.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {ausentes.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-500 mb-1">✗ Ausentes ({ausentes.length})</p>
                <ul className="space-y-0.5">
                  {ausentes.map((a) => (
                    <li key={a.id} className="text-sm text-zinc-400">{a.user.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
