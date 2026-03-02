import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { GAGAMOTO, resultadoGagamoto } from "@/lib/constants";
import { Calendar } from "lucide-react";

export default async function FixturePage({
  searchParams,
}: {
  searchParams: Promise<{ torneo?: string }>;
}) {
  const { torneo: torneoId } = await searchParams;
  const session = await auth();
  if (!session) return null;

  const [torneos, partidos] = await Promise.all([
    prisma.torneo.findMany({ orderBy: { fechaInicio: "desc" } }),
    prisma.partido.findMany({
      where: torneoId ? { torneoId } : undefined,
      orderBy: { fecha: "asc" },
      include: { torneo: true },
    }),
  ]);

  const torneoSeleccionado = torneoId
    ? torneos.find((t) => t.id === torneoId)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Calendar className="text-[#0048FF]" size={24} />
          Fixture
        </h1>

        {torneos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/fixture"
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-black transition-colors ${
                !torneoId ? "bg-[#0048FF] text-white" : "bg-white hover:bg-zinc-100"
              }`}
            >
              Todos
            </Link>
            {torneos.map((t) => (
              <Link
                key={t.id}
                href={`/fixture?torneo=${t.id}`}
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

      {torneoSeleccionado && (
        <p className="text-sm text-zinc-500">{torneoSeleccionado.nombre}</p>
      )}

      {partidos.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold">No hay partidos cargados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {partidos.map((p) => {
            const esNuestro = p.equipo1 === GAGAMOTO || p.equipo2 === GAGAMOTO;
            const r = esNuestro ? resultadoGagamoto(p) : null;
            const resultBadge =
              r?.resultado === "G"
                ? "bg-green-500 text-white"
                : r?.resultado === "E"
                ? "bg-yellow-400 text-black"
                : r?.resultado === "P"
                ? "bg-red-500 text-white"
                : null;

            return (
              <Link
                key={p.id}
                href={`/fixture/${p.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-3 border-2 border-black bg-white hover:bg-[#EEF3FF] transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {resultBadge && (
                    <span
                      className={`${resultBadge} text-xs font-black w-7 h-7 flex items-center justify-center rounded-md`}
                    >
                      {r?.resultado}
                    </span>
                  )}
                  {!p.jugado && esNuestro && (
                    <span className="bg-[#EEF3FF] text-[#0048FF] border border-[#0048FF] text-xs font-bold px-2 py-0.5 rounded-md">
                      Pendiente
                    </span>
                  )}
                  <div>
                    <span className={`font-bold ${esNuestro ? "text-black" : "text-zinc-500"}`}>
                      {p.equipo1}
                    </span>
                    <span className="text-zinc-400 mx-2 text-sm">vs</span>
                    <span className={`font-bold ${esNuestro ? "text-black" : "text-zinc-500"}`}>
                      {p.equipo2}
                    </span>
                  </div>
                  {p.torneo && (
                    <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                      {p.torneo.nombre}
                    </span>
                  )}
                </div>
                <div className="text-right text-sm text-zinc-500 shrink-0">
                  {p.jugado && r ? (
                    <span className="font-black text-lg text-black">
                      {r.gf} - {r.gc}
                    </span>
                  ) : p.fecha ? (
                    format(new Date(p.fecha), "dd/MM HH:mm", { locale: es })
                  ) : (
                    "Sin fecha"
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
