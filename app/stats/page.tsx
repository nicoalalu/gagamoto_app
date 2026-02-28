import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Trophy, Target, Square, Star, BarChart2 } from "lucide-react";

export default async function StatsPage() {
  await auth();

  const playedMatches = await prisma.match.findMany({ where: { goalsFor: { not: null } } });
  const totalPlayed = playedMatches.length;
  const wins = playedMatches.filter(m => m.goalsFor! > m.goalsAgainst!).length;
  const draws = playedMatches.filter(m => m.goalsFor === m.goalsAgainst).length;
  const losses = totalPlayed - wins - draws;
  const goalsFor = playedMatches.reduce((s, m) => s + (m.goalsFor ?? 0), 0);
  const goalsAgainst = playedMatches.reduce((s, m) => s + (m.goalsAgainst ?? 0), 0);

  const users = await prisma.user.findMany({ select: { id: true, name: true, image: true } });
  const goals = await prisma.goal.findMany();
  const cards = await prisma.card.findMany();
  const ratings = await prisma.rating.findMany();

  const playerStats = users.map(user => {
    const userGoals = goals.filter(g => g.userId === user.id).length;
    const userYellow = cards.filter(c => c.userId === user.id && c.type === "YELLOW").length;
    const userRed = cards.filter(c => c.userId === user.id && c.type === "RED").length;
    const mvpWins = playedMatches.filter(m => m.mvpUserId === user.id).length;
    const userRatings = ratings.filter(r => r.ratedUserId === user.id);
    const avgRating = userRatings.length
      ? Math.round((userRatings.reduce((s, r) => s + r.score, 0) / userRatings.length) * 10) / 10
      : null;
    return { ...user, goals: userGoals, yellowCards: userYellow, redCards: userRed, mvpWins, avgRating };
  }).sort((a, b) => b.goals - a.goals);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black flex items-center gap-2"><BarChart2 size={24} /> Estadísticas</h1>

      {/* Team stats */}
      <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wide mb-4">Equipo</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "PJ", value: totalPlayed },
            { label: "PG", value: wins, color: "text-green-600" },
            { label: "PE", value: draws, color: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-3xl font-black ${s.color ?? ""}`}>{s.value}</div>
              <div className="text-xs text-zinc-400 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "PP", value: losses, color: "text-red-600" },
            { label: "GF", value: goalsFor },
            { label: "GC", value: goalsAgainst },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-3xl font-black ${s.color ?? ""}`}>{s.value}</div>
              <div className="text-xs text-zinc-400 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Player stats table */}
      <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-4 border-b-2 border-black">
          <h2 className="font-bold text-sm text-zinc-500 uppercase tracking-wide">Jugadores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-2 font-bold text-zinc-500">Jugador</th>
                <th className="px-3 py-2 font-bold text-zinc-500 text-center" title="Goles">⚽</th>
                <th className="px-3 py-2 font-bold text-zinc-500 text-center" title="Amarillas">🟡</th>
                <th className="px-3 py-2 font-bold text-zinc-500 text-center" title="Rojas">🔴</th>
                <th className="px-3 py-2 font-bold text-zinc-500 text-center" title="MVP">🏆</th>
                <th className="px-3 py-2 font-bold text-zinc-500 text-center" title="Rating">⭐</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map(p => (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-yellow-50 transition-colors">
                  <td className="px-4 py-2 font-semibold">{p.name}</td>
                  <td className="px-3 py-2 text-center font-black">{p.goals}</td>
                  <td className="px-3 py-2 text-center font-black">{p.yellowCards}</td>
                  <td className="px-3 py-2 text-center font-black">{p.redCards}</td>
                  <td className="px-3 py-2 text-center font-black">{p.mvpWins}</td>
                  <td className="px-3 py-2 text-center font-black text-yellow-600">{p.avgRating ?? "-"}</td>
                </tr>
              ))}
              {playerStats.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">Sin datos todavía</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
