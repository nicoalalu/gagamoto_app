"use client";

import { useState } from "react";
import { Save, Plus } from "lucide-react";

type Jugador = { id: string; nombre: string; apellido: string };

interface Props {
  partidoId: string;
  equipo1: string;
  equipo2: string;
  jugadores: Jugador[];
  initialGolesEquipo1: number | null;
  initialGolesEquipo2: number | null;
  initialMvpId: string | null;
  ventanaAbierta: boolean;
}

export default function ResultadoForm({
  partidoId,
  equipo1,
  equipo2,
  jugadores,
  initialGolesEquipo1,
  initialGolesEquipo2,
  initialMvpId,
  ventanaAbierta,
}: Props) {
  const [g1, setG1] = useState(initialGolesEquipo1?.toString() ?? "");
  const [g2, setG2] = useState(initialGolesEquipo2?.toString() ?? "");
  const [mvpId, setMvpId] = useState(initialMvpId ?? "");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [jugadorGolId, setJugadorGolId] = useState("");
  const [minutoGol, setMinutoGol] = useState("");
  const [addingGol, setAddingGol] = useState(false);

  const [jugadorTarjetaId, setJugadorTarjetaId] = useState("");
  const [tipoTarjeta, setTipoTarjeta] = useState<"AMARILLA" | "ROJA">("AMARILLA");
  const [addingTarjeta, setAddingTarjeta] = useState(false);

  const [msg, setMsg] = useState("");

  async function guardarResultado(e: React.FormEvent) {
    e.preventDefault();
    if (g1 === "" || g2 === "") return;
    setSaving(true);
    setMsg("");
    await fetch(`/api/partidos/${partidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        golesEquipo1: Number(g1),
        golesEquipo2: Number(g2),
        jugado: true,
        mvpJugadorId: ventanaAbierta ? (mvpId || null) : undefined,
      }),
    });
    setSaving(false);
    setSavedOk(true);
    setMsg("Resultado guardado");
    setTimeout(() => setSavedOk(false), 3000);
  }

  async function agregarGol(e: React.FormEvent) {
    e.preventDefault();
    if (!jugadorGolId) return;
    setAddingGol(true);
    await fetch(`/api/partidos/${partidoId}/goles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugadorId: jugadorGolId,
        minuto: minutoGol ? Number(minutoGol) : null,
      }),
    });
    setAddingGol(false);
    setJugadorGolId("");
    setMinutoGol("");
    setMsg("⚽ Gol registrado — recargá la página para verlo");
  }

  async function agregarTarjeta(e: React.FormEvent) {
    e.preventDefault();
    if (!jugadorTarjetaId) return;
    setAddingTarjeta(true);
    await fetch(`/api/partidos/${partidoId}/tarjetas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jugadorId: jugadorTarjetaId, tipo: tipoTarjeta }),
    });
    setAddingTarjeta(false);
    setJugadorTarjetaId("");
    setMsg("Tarjeta registrada — recargá la página para verla");
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Cargar resultado</h2>
        <p className="text-xs text-gray-400 mt-0.5">Visible solo vos</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Score */}
        <form onSubmit={guardarResultado}>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">{equipo1}</label>
              <input
                type="number"
                min={0}
                value={g1}
                onChange={(e) => setG1(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-3xl font-black text-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <span className="text-2xl font-black text-gray-300 pb-3">–</span>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">{equipo2}</label>
              <input
                type="number"
                min={0}
                value={g2}
                onChange={(e) => setG2(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-3xl font-black text-center focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          {ventanaAbierta && (
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">MVP</label>
              <select value={mvpId} onChange={(e) => setMvpId(e.target.value)} className={inputCls}>
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
            type="submit"
            disabled={saving || g1 === "" || g2 === ""}
            className="mt-4 w-full bg-gray-900 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-40"
          >
            <Save size={14} />
            {saving ? "Guardando..." : "Guardar resultado"}
          </button>

          {msg && (
            <p className={`text-xs mt-2 text-center font-medium ${savedOk ? "text-green-600" : "text-gray-500"}`}>
              {msg}
            </p>
          )}
        </form>

        {/* Goles */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Agregar gol</p>
          <form onSubmit={agregarGol} className="flex gap-2">
            <select
              required
              value={jugadorGolId}
              onChange={(e) => setJugadorGolId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
              max={120}
              value={minutoGol}
              onChange={(e) => setMinutoGol(e.target.value)}
              placeholder="Min"
              className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              disabled={addingGol}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Plus size={14} /> Gol
            </button>
          </form>
        </div>

        {/* Tarjetas */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Agregar tarjeta</p>
          <form onSubmit={agregarTarjeta} className="flex gap-2">
            <select
              required
              value={jugadorTarjetaId}
              onChange={(e) => setJugadorTarjetaId(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="AMARILLA">🟨</option>
              <option value="ROJA">🟥</option>
            </select>
            <button
              type="submit"
              disabled={addingTarjeta}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Plus size={14} /> Tarjeta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
