import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Users } from "lucide-react";
import Image from "next/image";

export default async function PlayersPage() {
  await auth();

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  const goals = await prisma.goal.findMany();
  const cards = await prisma.card.findMany();
  const playedMatches = await prisma.match.findMany({ where: { goalsFor: { not: null } } });

  const playersWithStats = users.map(u => ({
    ...u,
    goals: goals.filter(g => g.userId === u.id).length,
    yellowCards: cards.filter(c => c.userId === u.id && c.type === "YELLOW").length,
    redCards: cards.filter(c => c.userId === u.id && c.type === "RED").length,
    mvpWins: playedMatches.filter(m => m.mvpUserId === u.id).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2"><Users size={24} /> Jugadores</h1>
        <span className="text-sm text-zinc-500">{users.length} jugadores</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {playersWithStats.map(p => (
          <div
            key={p.id}
            className="bg-white border-2 border-black rounded-xl p-4 flex items-center gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            {p.image ? (
              <Image
                src={p.image}
                alt={p.name ?? ""}
                width={48}
                height={48}
                className="rounded-full border-2 border-black"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-black bg-yellow-400 flex items-center justify-center font-black text-lg">
                {p.name?.[0] ?? "?"}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-black truncate">{p.name}</p>
              <p className="text-xs text-zinc-400 truncate">{p.email}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span title="Goles">⚽ {p.goals}</span>
              <span title="Amarillas">🟡 {p.yellowCards}</span>
              <span title="Rojas">🔴 {p.redCards}</span>
              <span title="MVP" className="text-yellow-600">🏆 {p.mvpWins}</span>
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="col-span-2 text-center py-16 text-zinc-400">
            <p className="text-lg font-semibold">Sin jugadores registrados</p>
            <p className="text-sm mt-1">Los jugadores aparecen al iniciar sesión</p>
          </div>
        )}
      </div>
    </div>
  );
}
