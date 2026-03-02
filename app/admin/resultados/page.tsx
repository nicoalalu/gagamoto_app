"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

type Torneo = { id: string; nombre: string };
type Partido = {
  id: string;
  equipo1: string;
  equipo2: string;
  fecha: string | null;
  jugado: boolean;
  golesEquipo1: number | null;
  golesEquipo2: number | null;
};
type Jugador = { id: string; nombre: string; apellido: string; numeroCamiseta: number | null };

export default function AdminResultadosPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [torneoId, setTorneoId] = useState("");
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [selectedPartido, setSelectedPartido] = useState<Partido | null>(null);

  // Form state
  const [g1, setG1] = useState("");
  const [g2, setG2] = useState("");
  const [jugadorGolId, setJugadorGolId] = useState("");
  const [minutoGol, setMinutoGol] = useState("");
  const [jugadorTarjetaId, setJugadorTarjetaId] = useState("");
  const [tipoTarjeta, setTipoTarjeta] = useState<"AMARILLA" | "ROJA">("AMARILLA");
  const [mvpId, setMvpId] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/torneos").then((r) => r.json()), fetch("/api/jugadores").then((r) => r.json())]).then(
      ([t, j]) => {
        setTorneos(t);
        setJugadores(j);
      }
    );
  }, []);

  useEffect(() => {
    if (!torneoId) { setPartidos([]); return; }
    fetch(`/api/partidos?torneoId=${torneoId}`)
      .then((r) => r.json())
      .then(setPartidos);
  }, [torneoId]);

  async function guardarResultado() {
    if (!selectedPartido) return;
    setSaving(true);
    setMsg("");
    await fetch(`/api/partidos/${selectedPartido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        golesEquipo1: Number(g1),
        golesEquipo2: Number(g2),
        jugado: true,
        mvpJugadorId: mvpId || null,
      }),
    });
    setMsg("✅ Resultado guardado");
    setSaving(false);
    setPartidos((prev) =>
      prev.map((p) =>
        p.id === selectedPartido.id
          ? { ...p, golesEquipo1: Number(g1), golesEquipo2: Number(g2), jugado: true }
          : p
      )
    );
  }

  async function agregarGol(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartido || !jugadorGolId) return;
    await fetch(`/api/partidos/${selectedPartido.id}/goles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId: jugadorGolId, minuto: minutoGol ? Number(minutoGol) : null }),
    });
    setMsg("⚽ Gol registrado");
    setJugadorGolId("");
    setMinutoGol("");
  }

  async function agregarTarjeta(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartido || !jugadorTarjetaId) return;
    await fetch(`/api/partidos/${selectedPartido.id}/tarjetas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId: jugadorTarjetaId, tipo: tipoTarjeta }),
    });
    setMsg("🟨 Tarjeta registrada");
    setJugadorTarjetaId("");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg border-2 border-black hover:bg-zinc-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black">Cargar Resultados</h1>
      </div>

      {/* Selección torneo */}
      <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <label className="block text-xs font-bold text-zinc-500 mb-1">Torneo</label>
        <select
          value={torneoId}
          onChange={(e) => { setTorneoId(e.target.value); setSelectedPartido(null); setMsg(""); }}
          className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Seleccioná un torneo</option>
          {torneos.map((t) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>

        {partidos.length > 0 && (
          <div className="mt-3">
            <label className="block text-xs font-bold text-zinc-500 mb-1">Partido</label>
            <select
              value={selectedPartido?.id ?? ""}
              onChange={(e) => {
                const p = partidos.find((x) => x.id === e.target.value) ?? null;
                setSelectedPartido(p);
                setG1(p?.golesEquipo1?.toString() ?? "");
                setG2(p?.golesEquipo2?.toString() ?? "");
                setMsg("");
              }}
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Seleccioná un partido</option>
              {partidos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.equipo1} vs {p.equipo2}{p.jugado ? " ✓" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedPartido && (
        <>
          {/* Resultado */}
          <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-bold mb-4">Resultado</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1">
                <label className="text-xs font-bold text-zinc-500">{selectedPartido.equipo1}</label>
                <input
                  type="number"
                  min={0}
                  value={g1}
                  onChange={(e) => setG1(e.target.value)}
                  className="w-full border-2 border-black rounded-lg px-3 py-2 text-2xl font-black text-center mt-1"
                />
              </div>
              <span className="text-2xl font-black text-zinc-400 pt-5">–</span>
              <div className="flex-1">
                <label className="text-xs font-bold text-zinc-500">{selectedPartido.equipo2}</label>
                <input
                  type="number"
                  min={0}
                  value={g2}
                  onChange={(e) => setG2(e.target.value)}
                  className="w-full border-2 border-black rounded-lg px-3 py-2 text-2xl font-black text-center mt-1"
                />
              </div>
            </div>

            {jugadores.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-bold text-zinc-500">MVP</label>
                <select
                  value={mvpId}
                  onChange={(e) => setMvpId(e.target.value)}
                  className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm mt-1"
                >
                  <option value="">Sin MVP</option>
                  {jugadores.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nombre} {j.apellido}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={guardarResultado}
              disabled={saving || g1 === "" || g2 === ""}
              className="mt-4 bg-[#0048FF] text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-[#003ACC] flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Save size={15} />
              {saving ? "Guardando..." : "Guardar resultado"}
            </button>
            {msg && <p className="text-sm mt-2">{msg}</p>}
          </div>

          {/* Goles */}
          <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-bold mb-4">⚽ Agregar gol</h2>
            <form onSubmit={agregarGol} className="flex gap-2 flex-wrap">
              <select
                required
                value={jugadorGolId}
                onChange={(e) => setJugadorGolId(e.target.value)}
                className="flex-1 border-2 border-black rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Jugador</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} {j.apellido}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={90}
                value={minutoGol}
                onChange={(e) => setMinutoGol(e.target.value)}
                placeholder="Min"
                className="w-20 border-2 border-black rounded-lg px-2 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg border-2 border-black text-sm"
              >
                +
              </button>
            </form>
          </div>

          {/* Tarjetas */}
          <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-bold mb-4">🟨 Agregar tarjeta</h2>
            <form onSubmit={agregarTarjeta} className="flex gap-2 flex-wrap">
              <select
                required
                value={jugadorTarjetaId}
                onChange={(e) => setJugadorTarjetaId(e.target.value)}
                className="flex-1 border-2 border-black rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Jugador</option>
                {jugadores.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} {j.apellido}
                  </option>
                ))}
              </select>
              <select
                value={tipoTarjeta}
                onChange={(e) => setTipoTarjeta(e.target.value as "AMARILLA" | "ROJA")}
                className="border-2 border-black rounded-lg px-3 py-2 text-sm"
              >
                <option value="AMARILLA">🟨 Amarilla</option>
                <option value="ROJA">🟥 Roja</option>
              </select>
              <button
                type="submit"
                className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg border-2 border-black text-sm"
              >
                +
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
