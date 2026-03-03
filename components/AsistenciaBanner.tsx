"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Calendar } from "lucide-react";

type Props = {
  partidoId: string;
  rival: string;
  fecha: string | null;
  lugar: string | null;
};

export default function AsistenciaBanner({ partidoId, rival, fecha, lugar }: Props) {
  const [estado, setEstado] = useState<"SI" | "NO" | "loading" | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function responder(nuevoEstado: "SI" | "NO") {
    setEstado("loading");
    await fetch(`/api/partidos/${partidoId}/asistencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    setEstado(nuevoEstado);
    // Dismiss after short delay so the user sees the confirmation
    setTimeout(() => setDismissed(true), 1200);
  }

  const loading = estado === "loading";

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-2xl px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-1">
            ¿Vas al próximo partido?
          </p>
          <p className="font-bold text-gray-900 text-lg leading-tight truncate">
            vs. {rival}
          </p>
          {fecha && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
              <Calendar size={13} className="text-yellow-500 shrink-0" />
              {fecha}
              {lugar && <span className="text-gray-400">· {lugar}</span>}
            </p>
          )}
        </div>

        {estado === "SI" ? (
          <span className="flex items-center gap-1.5 text-green-700 font-semibold text-sm bg-green-100 px-3 py-1.5 rounded-xl shrink-0">
            <CheckCircle size={15} /> ¡Confirmado!
          </span>
        ) : estado === "NO" ? (
          <span className="flex items-center gap-1.5 text-red-600 font-semibold text-sm bg-red-100 px-3 py-1.5 rounded-xl shrink-0">
            <XCircle size={15} /> No vas
          </span>
        ) : (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => responder("SI")}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              Sí
            </button>
            <button
              onClick={() => responder("NO")}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle size={15} />
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
