"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Upload, Users } from "lucide-react";

type Jugador = { id: string; nombre: string; apellido: string; numeroCamiseta: number | null };

export default function AdminJugadoresPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [numero, setNumero] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadJugadores() {
    const data = await fetch("/api/jugadores").then((r) => r.json());
    setJugadores(data);
  }

  useEffect(() => { loadJugadores(); }, []);

  async function agregarJugador(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddMsg("");
    const res = await fetch("/api/jugadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, apellido, numeroCamiseta: numero ? Number(numero) : null }),
    });
    const data = await res.json();
    if (res.ok) {
      setJugadores((prev) => [...prev, data].sort((a: Jugador, b: Jugador) => a.apellido.localeCompare(b.apellido)));
      setNombre("");
      setApellido("");
      setNumero("");
      setAddMsg("✅ Jugador agregado");
    } else {
      setAddMsg(`❌ ${data.error}`);
    }
    setAdding(false);
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

  async function importarJugadores(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText) return;
    setImporting(true);
    setImportMsg("");
    setImportError("");
    try {
      const res = await fetch("/api/jugadores/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`✅ ${data.created} jugadores importados/actualizados`);
        setCsvText("");
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
        await loadJugadores();
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jugadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestionar el plantel</p>
        </div>
      </div>

      {/* Manual add */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-gray-400" /> Agregar jugador
        </h2>
        <form onSubmit={agregarJugador} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <input
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Apellido"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <input
            type="number"
            min={1}
            max={99}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número de camiseta (opcional)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            {adding ? "Agregando..." : "Agregar"}
          </button>
          {addMsg && <p className={`text-sm font-medium ${addMsg.startsWith("✅") ? "text-green-700" : "text-red-700"}`}>{addMsg}</p>}
        </form>
      </div>

      {/* CSV import */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Upload size={16} className="text-gray-400" /> Importar desde CSV
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Columnas: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">Nombre, Apellido, Numero_de_camiseta</code>
        </p>
        <form onSubmit={importarJugadores} className="space-y-3">
          {/* Input oculto — se abre con el botón de abajo para evitar bugs de foco en macOS */}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-2">
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
          <button
            type="submit"
            disabled={importing || !csvText}
            className="bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
          >
            {importing ? "⏳ Importando..." : "Importar"}
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

      {/* List */}
      {jugadores.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Plantel <span className="text-gray-400 font-normal">({jugadores.length})</span></h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {jugadores.map((j) => (
              <li key={j.id} className="flex items-center px-5 py-3 gap-3">
                {j.numeroCamiseta !== null && (
                  <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {j.numeroCamiseta}
                  </span>
                )}
                <span className="font-medium text-gray-900 text-sm">
                  {j.nombre} {j.apellido}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
