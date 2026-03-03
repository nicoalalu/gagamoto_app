"use client";

import { useRef, useState } from "react";
import { CheckCircle, XCircle, Calendar } from "lucide-react";

type Props = {
  partidoId: string;
  rival: string;
  fecha: string | null;
  lugar: string | null;
};

export default function AsistenciaBanner({ partidoId, rival, fecha, lugar }: Props) {
  const [estado, setEstado] = useState<"SI" | "NO" | "NO_PENDING" | "loading" | null>(null);
  const [justificacion, setJustificacion] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (dismissed) return null;

  async function responder(nuevoEstado: "SI" | "NO", texto?: string) {
    setEstado("loading");
    await fetch(`/api/partidos/${partidoId}/asistencia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: nuevoEstado,
        justificacion: nuevoEstado === "NO" ? (texto ?? justificacion) : null,
      }),
    });
    setEstado(nuevoEstado);
    setTimeout(() => setDismissed(true), 1200);
  }

  function handleClickNo() {
    setEstado("NO_PENDING");
    setTimeout(() => inputRef.current?.focus(), 50);
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
              disabled={loading || estado === "NO_PENDING"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              Sí
            </button>
            <button
              onClick={handleClickNo}
              disabled={loading}
              className={[
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50",
                estado === "NO_PENDING"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-700",
              ].join(" ")}
            >
              <XCircle size={15} />
              No
            </button>
          </div>
        )}
      </div>

      {/* Justificación — aparece al elegir No */}
      {estado === "NO_PENDING" && (
        <div className="mt-3 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            maxLength={50}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") responder("NO"); }}
            placeholder="¿Por qué no podés ir? (opcional)"
            className="flex-1 border border-yellow-300 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-gray-400"
          />
          <button
            onClick={() => responder("NO")}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
