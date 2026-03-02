"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import Link from "next/link";

type Torneo = { id: string; nombre: string; fechaInicio: string | null; fechaFin: string | null };

export default function AdminTorneoPage() {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [selectedTorneoId, setSelectedTorneoId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/torneos")
      .then((r) => r.json())
      .then(setTorneos);
  }, []);

  async function crearTorneo(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/torneos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, fechaInicio, fechaFin }),
    });
    const data = await res.json();
    if (res.ok) {
      setTorneos((prev) => [data, ...prev]);
      setNombre("");
      setFechaInicio("");
      setFechaFin("");
      setMsg("✅ Torneo creado");
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setLoading(false);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  async function importarFixture(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText || !selectedTorneoId) return;
    setImporting(true);
    setImportMsg("");
    const res = await fetch("/api/partidos/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ torneoId: selectedTorneoId, csv: csvText }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`✅ ${data.created} partidos importados`);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
    } else {
      setImportMsg(`❌ Error al importar`);
    }
    setImporting(false);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg border-2 border-black hover:bg-zinc-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black">Torneos y Fixture</h1>
      </div>

      {/* Crear torneo */}
      <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Plus size={16} />
          Nuevo torneo
        </h2>
        <form onSubmit={crearTorneo} className="space-y-3">
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del torneo"
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-zinc-500">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-500">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0048FF] text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-[#003ACC] transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear torneo"}
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </div>

      {/* Importar fixture CSV */}
      <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-bold mb-1 flex items-center gap-2">
          <Upload size={16} />
          Importar fixture desde CSV
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Columnas esperadas: <code>Fecha, Equipo_1, Equipo_2, Horario, Lugar</code>
        </p>
        <form onSubmit={importarFixture} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-zinc-500">Torneo</label>
            <select
              required
              value={selectedTorneoId}
              onChange={(e) => setSelectedTorneoId(e.target.value)}
              className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm mt-1"
            >
              <option value="">Seleccioná un torneo</option>
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500">Archivo CSV</label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              className="w-full mt-1 text-sm"
            />
          </div>
          {csvText && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-40">
              {csvText.slice(0, 500)}…
            </div>
          )}
          <button
            type="submit"
            disabled={importing || !csvText || !selectedTorneoId}
            className="bg-[#0048FF] text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-[#003ACC] transition-colors text-sm disabled:opacity-50"
          >
            {importing ? "Importando..." : "Importar partidos"}
          </button>
          {importMsg && <p className="text-sm">{importMsg}</p>}
        </form>
      </div>

      {/* Torneos existentes */}
      {torneos.length > 0 && (
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">
            Torneos creados
          </h2>
          <ul className="space-y-2">
            {torneos.map((t) => (
              <li
                key={t.id}
                className="border-2 border-zinc-200 rounded-xl px-4 py-3 bg-white flex justify-between items-center"
              >
                <span className="font-semibold">{t.nombre}</span>
                {t.fechaInicio && (
                  <span className="text-xs text-zinc-400">
                    {t.fechaInicio?.slice(0, 10)} → {t.fechaFin?.slice(0, 10)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
