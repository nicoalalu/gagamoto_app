import { prisma } from "@/lib/db";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

export default async function MatchesPage() {
  const matches = await prisma.match.findMany({
    orderBy: { date: "desc" },
    include: {
      attendance: true,
      goals: true,
      _count: { select: { mvpVotes: true } },
    },
  });

  const upcoming = matches.filter(m => new Date(m.date) > new Date());
  const past = matches.filter(m => new Date(m.date) <= new Date());

  function resultBadge(m: (typeof matches)[0]) {
    if (m.goalsFor === null) return null;
    const gf = m.goalsFor!;
    const ga = m.goalsAgainst!;
    const color =
      gf > ga ? "bg-green-400" : gf === ga ? "bg-blue-300" : "bg-red-400";
    return (
      <span className={`${color} border border-black rounded px-2 py-0.5 text-xs font-black`}>
        {gf} - {ga}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Partidos</h1>
        <Link
          href="/matches/new"
          className="flex items-center gap-1.5 bg-yellow-400 border-2 border-black rounded-lg px-4 py-2 font-bold text-sm hover:bg-yellow-500 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus size={16} />
          Nuevo
        </Link>
      </div>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Próximos</h2>
          <div className="space-y-2">
            {upcoming.reverse().map(m => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center justify-between bg-white border-2 border-black rounded-xl px-4 py-3 hover:bg-yellow-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              >
                <div>
                  <p className="font-bold">vs {m.opponent}</p>
                  <p className="text-xs text-zinc-500">{formatDateShort(m.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 font-semibold">
                    {m.attendance.filter(a => a.status === "YES").length} ✓
                  </span>
                  <ChevronRight size={16} className="text-zinc-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wide mb-3">Jugados</h2>
          <div className="space-y-2">
            {past.map(m => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="flex items-center justify-between bg-white border-2 border-black rounded-xl px-4 py-3 hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="font-bold">vs {m.opponent}</p>
                  <p className="text-xs text-zinc-500">{formatDateShort(m.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {resultBadge(m)}
                  <ChevronRight size={16} className="text-zinc-400" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg font-semibold">No hay partidos todavía</p>
          <p className="text-sm mt-1">Creá el primero usando el botón de arriba</p>
        </div>
      )}
    </div>
  );
}
