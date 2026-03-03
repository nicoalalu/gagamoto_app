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
  const [fileName, setFileName] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importError, setImportError] = useState("");
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
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.onerror = () => setImportError("No se pudo leer el archivo");
    reader.readAsText(file);
  }

  async function importarFixture(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText || !selectedTorneoId) return;
    setImporting(true);
    setImportMsg("");
    setImportError("");
    try {
      const res = await fetch("/api/partidos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ torneoId: selectedTorneoId, csv: csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`✅ ${data.created} partidos importados`);
        setCsvText("");
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setImportMsg(`❌ ${data.error || "Error al importar"}`);
        setImportError(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setImportMsg("❌ Error de conexión al importar");
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torneos y Fixture</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crear torneos e importar partidos</p>
        </div>
      </div>

      {/* Crear torneo */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-gray-400" />
          Nuevo torneo
        </h2>
        <form onSubmit={crearTorneo} className="space-y-3">
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del torneo"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500">Fecha inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">Fecha fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear torneo"}
          </button>
          {msg && <p className={`text-sm font-medium ${msg.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>{msg}</p>}
        </form>
      </div>

      {/* Importar fixture CSV */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Upload size={16} className="text-gray-400" />
          Importar fixture desde CSV
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Columnas esperadas: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">Fecha, Equipo_1, Equipo_2, Horario, Lugar</code>
        </p>
        <form onSubmit={importarFixture} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500">Torneo</label>
            <select
              required
              value={selectedTorneoId}
              onChange={(e) => setSelectedTorneoId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
            <label className="text-xs font-semibold text-gray-500">Archivo CSV</label>
            {/* Input oculto — se abre con el botón de abajo para evitar bugs de foco en macOS */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold bg-white hover:bg-gray-50 transition-colors"
              >
                Elegir archivo
              </button>
              <span className="text-sm text-gray-500 truncate max-w-[220px]">
                {fileName || "Ningún archivo seleccionado"}
              </span>
            </div>
          </div>
          {csvText && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-40">
              {csvText.slice(0, 500)}…
            </div>
          )}
          <button
            type="submit"
            disabled={importing || !csvText || !selectedTorneoId}
            className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            {importing ? "⏳ Importando..." : "Importar partidos"}
          </button>
          {importMsg && (
            <p className={`text-sm font-medium ${importMsg.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>
              {importMsg}
            </p>
          )}
          {importError && (
            <pre className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-800 overflow-x-auto whitespace-pre-wrap">
              {importError}
            </pre>
          )}
        </form>
      </div>

      {/* Torneos existentes */}
      {torneos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Torneos creados</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {torneos.map((t) => (
              <li
                key={t.id}
                className="px-5 py-3.5 bg-white flex justify-between items-center"
              >
                <span className="font-medium text-gray-900">{t.nombre}</span>
                {t.fechaInicio && (
                  <span className="text-xs text-gray-400">
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
