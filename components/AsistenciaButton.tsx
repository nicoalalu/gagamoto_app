"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Estado = "SI" | "NO" | null;

export default function AsistenciaButton({
  partidoId,
  initialEstado,
}: {
  partidoId: string;
  initialEstado: Estado;
}) {
  const [estado, setEstado] = useState<Estado>(initialEstado);
  const [loading, setLoading] = useState(false);

  async function toggle(nuevoEstado: "SI" | "NO") {
    setLoading(true);
    try {
      await fetch(`/api/partidos/${partidoId}/asistencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setEstado(nuevoEstado);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs text-zinc-400 font-medium">¿Vas a ir?</span>
      <div className="flex gap-2">
        <button
          onClick={() => toggle("SI")}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-black transition-colors",
            estado === "SI"
              ? "bg-green-500 text-white"
              : "bg-white text-zinc-600 hover:bg-green-50"
          )}
        >
          <CheckCircle size={15} />
          Sí
        </button>
        <button
          onClick={() => toggle("NO")}
          disabled={loading}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-black transition-colors",
            estado === "NO"
              ? "bg-red-500 text-white"
              : "bg-white text-zinc-600 hover:bg-red-50"
          )}
        >
          <XCircle size={15} />
          No
        </button>
      </div>
    </div>
  );
}
