"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Trophy, Target, Users, Star, Calendar,
  CheckCircle, XCircle, Plus, Minus, Square
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Player = { id: string; name: string | null; image: string | null };

type Match = {
  id: string;
  date: string;
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  mvpUserId: string | null;
  mvpUser: Player | null;
  attendance: Array<{ id: string; userId: string; status: string; excuse: string | null; user: Player }>;
  goals: Array<{ id: string; userId: string; user: Player }>;
  cards: Array<{ id: string; userId: string; type: string; user: Player }>;
  mvpVotes: Array<{ id: string; voterId: string; votedUserId: string; voter: { id: string; name: string | null }; votedUser: Player }>;
  ratings: Array<{ id: string; raterId: string; ratedUserId: string; score: number; rater: { id: string; name: string | null }; ratedUser: Player }>;
};

type Props = {
  match: Match;
  players: Player[];
  currentUserId: string;
  played: boolean;
  future: boolean;
  votingOpen: boolean;
};

type Tab = "attendance" | "result" | "goals" | "cards" | "mvp" | "ratings";

export default function MatchDetailClient({ match, players, currentUserId, played, future, votingOpen }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ── Attendance ────────────────────────────────────────────────────────────
  const [excuse, setExcuse] = useState("");
  const myAttendance = match.attendance.find(a => a.userId === currentUserId);

  async function confirmAttendance(status: "YES" | "NO") {
    if (status === "NO" && !excuse.trim()) {
      setMsg("Escribí una justificación para ausencia");
      return;
    }
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/matches/${match.id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, excuse: status === "NO" ? excuse : null }),
    });
    if (res.ok) {
      setMsg(status === "YES" ? "¡Confirmaste tu asistencia!" : "Ausencia registrada");
      router.refresh();
    } else {
      const e = await res.json();
      setMsg(e.error ?? "Error");
    }
    setLoading(false);
  }

  // ── Result ────────────────────────────────────────────────────────────────
  const [goalsFor, setGoalsFor] = useState(match.goalsFor?.toString() ?? "");
  const [goalsAgainst, setGoalsAgainst] = useState(match.goalsAgainst?.toString() ?? "");

  async function submitResult() {
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/matches/${match.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalsFor: parseInt(goalsFor), goalsAgainst: parseInt(goalsAgainst) }),
    });
    if (res.ok) { setMsg("Resultado guardado"); router.refresh(); }
    else { const e = await res.json(); setMsg(e.error ?? "Error"); }
    setLoading(false);
  }

  // ── Goals ─────────────────────────────────────────────────────────────────
  const [goalPlayerId, setGoalPlayerId] = useState("");

  async function addGoal() {
    if (!goalPlayerId) return;
    setLoading(true);
    const res = await fetch(`/api/matches/${match.id}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: goalPlayerId }),
    });
    if (res.ok) router.refresh();
    else { const e = await res.json(); setMsg(e.error ?? "Error"); }
    setLoading(false);
  }

  async function removeGoal(goalId: string) {
    setLoading(true);
    await fetch(`/api/matches/${match.id}/goals?goalId=${goalId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [cardType, setCardType] = useState<"YELLOW" | "RED">("YELLOW");

  async function addCard() {
    if (!cardPlayerId) return;
    setLoading(true);
    const res = await fetch(`/api/matches/${match.id}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: cardPlayerId, type: cardType }),
    });
    if (res.ok) router.refresh();
    else { const e = await res.json(); setMsg(e.error ?? "Error"); }
    setLoading(false);
  }

  async function removeCard(cardId: string) {
    setLoading(true);
    await fetch(`/api/matches/${match.id}/cards?cardId=${cardId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  // ── MVP Vote ──────────────────────────────────────────────────────────────
  const [mvpVoteId, setMvpVoteId] = useState(
    match.mvpVotes.find(v => v.voterId === currentUserId)?.votedUserId ?? ""
  );

  async function submitVote() {
    if (!mvpVoteId) return;
    setLoading(true);
    setMsg("");
    const res = await fetch(`/api/matches/${match.id}/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votedUserId: mvpVoteId }),
    });
    if (res.ok) { setMsg("Voto registrado ✓"); router.refresh(); }
    else { const e = await res.json(); setMsg(e.error ?? "Error"); }
    setLoading(false);
  }

  // ── Ratings ───────────────────────────────────────────────────────────────
  const otherPlayers = players.filter(p => p.id !== currentUserId);
  const [ratingScores, setRatingScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const r of match.ratings.filter(r => r.raterId === currentUserId)) {
      initial[r.ratedUserId] = r.score;
    }
    return initial;
  });

  async function submitRatings() {
    setLoading(true);
    setMsg("");
    const ratingsPayload = Object.entries(ratingScores)
      .filter(([, s]) => s > 0)
      .map(([ratedUserId, score]) => ({ ratedUserId, score }));
    const res = await fetch(`/api/matches/${match.id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings: ratingsPayload }),
    });
    if (res.ok) { setMsg("Ratings guardados ✓"); router.refresh(); }
    else { const e = await res.json(); setMsg(e.error ?? "Error"); }
    setLoading(false);
  }

  // ── Goal counts by player ─────────────────────────────────────────────────
  const goalsByPlayer: Record<string, number> = {};
  for (const g of match.goals) goalsByPlayer[g.userId] = (goalsByPlayer[g.userId] ?? 0) + 1;

  // ── Vote counts ───────────────────────────────────────────────────────────
  const voteCount: Record<string, number> = {};
  for (const v of match.mvpVotes) voteCount[v.votedUserId] = (voteCount[v.votedUserId] ?? 0) + 1;

  // ── Rating averages ───────────────────────────────────────────────────────
  const ratingAvg: Record<string, { sum: number; count: number }> = {};
  for (const r of match.ratings) {
    if (!ratingAvg[r.ratedUserId]) ratingAvg[r.ratedUserId] = { sum: 0, count: 0 };
    ratingAvg[r.ratedUserId].sum += r.score;
    ratingAvg[r.ratedUserId].count += 1;
  }

  const resultLabel = match.goalsFor !== null
    ? match.goalsFor > match.goalsAgainst!
      ? "Victoria"
      : match.goalsFor === match.goalsAgainst
        ? "Empate"
        : "Derrota"
    : null;

  const resultColor = resultLabel === "Victoria"
    ? "text-green-600"
    : resultLabel === "Derrota"
      ? "text-red-600"
      : "text-blue-600";

  const tabs: { id: Tab; label: string }[] = [
    { id: "attendance", label: "Asistencia" },
    { id: "result", label: "Resultado" },
    { id: "goals", label: "Goles" },
    { id: "cards", label: "Tarjetas" },
    { id: "mvp", label: "MVP" },
    { id: "ratings", label: "Ratings" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/matches" className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black">vs {match.opponent}</h1>
          <p className="text-sm text-zinc-500 capitalize">{formatDate(match.date)}</p>
        </div>
      </div>

      {/* Result badge */}
      {match.goalsFor !== null && (
        <div className="bg-white border-2 border-black rounded-xl p-4 flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span className={`font-black text-lg ${resultColor}`}>{resultLabel}</span>
          <span className="text-4xl font-black">{match.goalsFor} - {match.goalsAgainst}</span>
          {match.mvpUser && (
            <div className="flex items-center gap-1.5 bg-yellow-400 border border-black rounded-lg px-2 py-1">
              <Trophy size={14} />
              <span className="text-xs font-bold">{match.mvpUser.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Feedback msg */}
      {msg && (
        <p className="text-sm font-semibold bg-yellow-50 border border-yellow-300 rounded-lg px-3 py-2">{msg}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); setMsg(""); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
              activeTab === t.id ? "bg-black text-yellow-400 border-black" : "bg-white text-black border-black hover:bg-zinc-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Users size={18} /> Asistencia</h2>

            {future && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-600">
                  Tu estado:{" "}
                  <span className={myAttendance ? (myAttendance.status === "YES" ? "text-green-600" : "text-red-600") : "text-zinc-400"}>
                    {myAttendance ? (myAttendance.status === "YES" ? "Confirmado ✓" : `Ausente - ${myAttendance.excuse}`) : "Sin confirmar"}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmAttendance("YES")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-400 border-2 border-black rounded-lg py-2 font-bold text-sm hover:bg-green-500 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle size={16} /> Voy
                  </button>
                  <button
                    onClick={() => confirmAttendance("NO")}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-400 border-2 border-black rounded-lg py-2 font-bold text-sm hover:bg-red-500 disabled:opacity-50 transition-colors"
                  >
                    <XCircle size={16} /> No voy
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Justificación (obligatorio si no vas)"
                  value={excuse}
                  onChange={e => setExcuse(e.target.value)}
                  className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}

            <div className="space-y-2 mt-2">
              {["YES", "NO"].map(status => {
                const list = match.attendance.filter(a => a.status === status);
                if (list.length === 0) return null;
                return (
                  <div key={status}>
                    <p className={`text-xs font-bold mb-1 ${status === "YES" ? "text-green-600" : "text-red-600"}`}>
                      {status === "YES" ? `✓ Confirmados (${list.length})` : `✗ Ausentes (${list.length})`}
                    </p>
                    {list.map(a => (
                      <div key={a.id} className="flex items-center justify-between py-1">
                        <span className="text-sm font-semibold">{a.user.name}</span>
                        {a.excuse && <span className="text-xs text-zinc-400 italic">{a.excuse}</span>}
                      </div>
                    ))}
                  </div>
                );
              })}
              {match.attendance.length === 0 && <p className="text-sm text-zinc-400">Nadie confirmó todavía</p>}
            </div>
          </div>
        )}

        {/* RESULT */}
        {activeTab === "result" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Target size={18} /> Resultado</h2>
            {played ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold">Nosotros</label>
                    <input
                      type="number" min={0}
                      value={goalsFor}
                      onChange={e => setGoalsFor(e.target.value)}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 text-center text-xl font-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <span className="text-2xl font-black mt-4">-</span>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold">{match.opponent}</label>
                    <input
                      type="number" min={0}
                      value={goalsAgainst}
                      onChange={e => setGoalsAgainst(e.target.value)}
                      className="w-full border-2 border-black rounded-lg px-3 py-2 text-center text-xl font-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>
                <button
                  onClick={submitResult}
                  disabled={loading || goalsFor === "" || goalsAgainst === ""}
                  className="w-full bg-yellow-400 border-2 border-black rounded-xl py-2.5 font-bold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Guardando..." : "Guardar resultado"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-400">El resultado se puede cargar después de que se juegue el partido</p>
            )}
          </div>
        )}

        {/* GOALS */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Target size={18} /> Goles</h2>
            {played && (
              <div className="flex gap-2">
                <select
                  value={goalPlayerId}
                  onChange={e => setGoalPlayerId(e.target.value)}
                  className="flex-1 border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Seleccionar jugador</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button
                  onClick={addGoal}
                  disabled={loading || !goalPlayerId}
                  className="bg-yellow-400 border-2 border-black rounded-lg px-3 py-2 font-bold hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            <div className="space-y-2">
              {Object.entries(goalsByPlayer).map(([userId, count]) => {
                const player = players.find(p => p.id === userId);
                const playerGoals = match.goals.filter(g => g.userId === userId);
                return (
                  <div key={userId} className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="font-semibold text-sm">{player?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black">⚽ {count}</span>
                      {played && (
                        <button
                          onClick={() => removeGoal(playerGoals[playerGoals.length - 1].id)}
                          className="p-1 rounded hover:bg-red-100 transition-colors"
                        >
                          <Minus size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {match.goals.length === 0 && <p className="text-sm text-zinc-400">Sin goles registrados</p>}
            </div>
          </div>
        )}

        {/* CARDS */}
        {activeTab === "cards" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Square size={18} className="text-yellow-500" /> Tarjetas</h2>
            {played && (
              <div className="flex gap-2">
                <select
                  value={cardPlayerId}
                  onChange={e => setCardPlayerId(e.target.value)}
                  className="flex-1 border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">Seleccionar jugador</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select
                  value={cardType}
                  onChange={e => setCardType(e.target.value as "YELLOW" | "RED")}
                  className="border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="YELLOW">🟡 Amarilla</option>
                  <option value="RED">🔴 Roja</option>
                </select>
                <button
                  onClick={addCard}
                  disabled={loading || !cardPlayerId}
                  className="bg-yellow-400 border-2 border-black rounded-lg px-3 py-2 font-bold hover:bg-yellow-500 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            <div className="space-y-1">
              {match.cards.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1 border-b border-zinc-100">
                  <span className="font-semibold text-sm">{c.user.name}</span>
                  <div className="flex items-center gap-2">
                    <span>{c.type === "YELLOW" ? "🟡" : "🔴"}</span>
                    {played && (
                      <button onClick={() => removeCard(c.id)} className="p-1 rounded hover:bg-red-100">
                        <Minus size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {match.cards.length === 0 && <p className="text-sm text-zinc-400">Sin tarjetas registradas</p>}
            </div>
          </div>
        )}

        {/* MVP */}
        {activeTab === "mvp" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Votación MVP</h2>
            {match.mvpUser && (
              <div className="bg-yellow-400 border-2 border-black rounded-xl p-3 flex items-center gap-2">
                <Trophy size={20} />
                <span className="font-black">MVP: {match.mvpUser.name}</span>
              </div>
            )}
            {votingOpen ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">Seleccioná tu MVP del partido:</p>
                <div className="space-y-1">
                  {players.filter(p => p.id !== currentUserId).map(p => (
                    <button
                      key={p.id}
                      onClick={() => setMvpVoteId(p.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                        mvpVoteId === p.id ? "bg-yellow-400 border-black" : "bg-white border-zinc-200 hover:border-black"
                      }`}
                    >
                      {p.name}
                      {voteCount[p.id] ? <span className="ml-2 text-xs text-zinc-500">({voteCount[p.id]} votos)</span> : ""}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitVote}
                  disabled={loading || !mvpVoteId}
                  className="w-full bg-yellow-400 border-2 border-black rounded-xl py-2.5 font-bold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Votando..." : "Votar"}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {players.filter(p => p.id !== currentUserId).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 border-b border-zinc-100">
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span className="text-xs text-zinc-500">{voteCount[p.id] ?? 0} votos</span>
                  </div>
                ))}
                {!played && <p className="text-sm text-zinc-400">La votación abre cuando se cargue el resultado</p>}
                {played && !votingOpen && match.goalsFor !== null && (
                  <p className="text-sm text-zinc-400">La ventana de votación ya cerró</p>
                )}
                {played && match.goalsFor === null && (
                  <p className="text-sm text-zinc-400">Cargá el resultado primero para habilitar la votación</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* RATINGS */}
        {activeTab === "ratings" && (
          <div className="space-y-4">
            <h2 className="font-black text-lg flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Ratings (1-10)</h2>
            {votingOpen ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">Calificá a tus compañeros:</p>
                {otherPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm font-semibold">{p.name}</span>
                    <input
                      type="number" min={1} max={10}
                      value={ratingScores[p.id] ?? ""}
                      onChange={e => setRatingScores(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                      className="w-16 border-2 border-black rounded-lg px-2 py-1 text-center text-sm font-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                ))}
                <button
                  onClick={submitRatings}
                  disabled={loading}
                  className="w-full bg-yellow-400 border-2 border-black rounded-xl py-2.5 font-bold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Guardando..." : "Guardar ratings"}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {players.map(p => {
                  const avg = ratingAvg[p.id];
                  const score = avg ? Math.round((avg.sum / avg.count) * 10) / 10 : null;
                  return (
                    <div key={p.id} className="flex items-center justify-between py-1 border-b border-zinc-100">
                      <span className="text-sm font-semibold">{p.name}</span>
                      <span className="text-sm font-black text-yellow-600">{score !== null ? `⭐ ${score}` : "-"}</span>
                    </div>
                  );
                })}
                {!played && <p className="text-sm text-zinc-400">Los ratings se habilitan con el resultado</p>}
                {played && !votingOpen && match.goalsFor !== null && (
                  <p className="text-sm text-zinc-400">La ventana de ratings ya cerró</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
