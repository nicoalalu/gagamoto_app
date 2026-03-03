"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type Jugador = { id: string; nombre: string; apellido: string; numeroCamiseta: number | null };

type Props = {
  partidoId: string;
  jugadores: Jugador[];
  initialRatings: Record<string, number>;
  initialComentario: string;
  ventanaAbierta: boolean;
};

function contarPalabras(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function CalificacionForm({
  partidoId,
  jugadores,
  initialRatings,
  initialComentario,
  ventanaAbierta,
}: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>(initialRatings);
  const [comentario, setComentario] = useState(initialComentario);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (!ventanaAbierta) return null;

  const palabras = contarPalabras(comentario);
  const excede = palabras > 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (excede) return;
    setSaving(true);
    setError("");
    try {
      // Save ratings per player
      await Promise.all(
        Object.entries(ratings).map(([jugadorId, puntaje]) =>
          fetch(`/api/partidos/${partidoId}/calificaciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jugadorId, puntaje }),
          })
        )
      );
      // Save comment
      if (comentario.trim()) {
        await fetch(`/api/partidos/${partidoId}/resenas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comentario: comentario.trim() }),
        });
      }
      setSaved(true);
    } catch {
      setError("Error al guardar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Calificaciones</h2>
        <p className="text-sm text-green-600 font-medium">✓ Gracias por calificar el partido.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <h2 className="font-semibold text-gray-900">Calificá el partido</h2>
      <p className="text-xs text-gray-400 -mt-2">Puntuá a cada jugador del 1 al 10. Tenés 48 hs desde el partido.</p>

      {jugadores.length === 0 ? (
        <p className="text-sm text-gray-400">No hay jugadores registrados.</p>
      ) : (
        <div className="space-y-3">
          {jugadores.map((j) => (
            <div key={j.id} className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-800 font-medium min-w-0">
                {j.numeroCamiseta !== null && (
                  <span className="text-gray-400 text-xs mr-1.5">#{j.numeroCamiseta}</span>
                )}
                {j.nombre} {j.apellido}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatings((prev) => ({ ...prev, [j.id]: n }))}
                    className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                      ratings[j.id] === n
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comentario */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
          Comentario <span className="font-normal text-gray-400">(máx. 20 palabras)</span>
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          placeholder="¿Qué te pareció el partido?"
          className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
            excede
              ? "border-red-300 focus:ring-red-200"
              : "border-gray-200 focus:ring-gray-900"
          }`}
        />
        <p className={`text-xs mt-1 ${excede ? "text-red-500" : "text-gray-400"}`}>
          {palabras}/20 palabras
        </p>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      <button
        type="submit"
        disabled={saving || excede || Object.keys(ratings).length === 0}
        className="bg-gray-900 text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-40"
      >
        {saving ? "Guardando..." : "Guardar calificaciones"}
      </button>
    </form>
  );
}
