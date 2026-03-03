"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";

type Estado = "SI" | "NO" | null;

export default function AsistenciaButton({
  partidoId,
  initialEstado,
  initialJustificacion,
}: {
  partidoId: string;
  initialEstado: Estado;
  initialJustificacion?: string | null;
}) {
  const [estado, setEstado] = useState<Estado>(initialEstado);
  const [justificacion, setJustificacion] = useState(initialJustificacion ?? "");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when NO is selected
  useEffect(() => {
    if (estado === "NO") inputRef.current?.focus();
  }, [estado]);

  async function confirmar(nuevoEstado: "SI" | "NO", texto?: string) {
    setLoading(true);
    try {
      await fetch(`/api/partidos/${partidoId}/asistencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          justificacion: nuevoEstado === "NO" ? (texto ?? justificacion) : null,
        }),
      });
      setEstado(nuevoEstado);
    } finally {
      setLoading(false);
    }
  }

  function handleClickSi() {
    setJustificacion("");
    confirmar("SI");
  }

  function handleClickNo() {
    // Just toggle the UI; user fills in justification then it auto-saves on blur/enter
    setEstado("NO");
  }

  function handleJustificacionBlur() {
    if (estado === "NO") confirmar("NO", justificacion);
  }

  function handleJustificacionKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-xs text-gray-400 font-medium">¿Vas a ir?</p>
      <div className="flex gap-2">
        {/* SI */}
        <button
          onClick={handleClickSi}
          disabled={loading}
          className={[
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all",
            estado === "SI"
              ? "bg-green-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700",
          ].join(" ")}
        >
          <CheckCircle size={15} />
          Sí
        </button>
        {/* NO */}
        <button
          onClick={handleClickNo}
          disabled={loading}
          className={[
            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all",
            estado === "NO"
              ? "bg-red-500 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600",
          ].join(" ")}
        >
          <XCircle size={15} />
          No
        </button>
      </div>

      {/* Justificación (visible solo cuando NO) */}
      {estado === "NO" && (
        <div className="w-full">
          <input
            ref={inputRef}
            type="text"
            placeholder="Motivo (opcional)…"
            maxLength={50}
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            onBlur={handleJustificacionBlur}
            onKeyDown={handleJustificacionKeyDown}
            className="w-full text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
          />
          <p className="text-right text-[10px] text-gray-400 mt-0.5">
            {justificacion.length}/50
          </p>
        </div>
      )}
    </div>
  );
}
