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
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
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
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText((ev.target?.result as string) ?? "");
    reader.readAsText(file);
  }

  async function importarJugadores(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText) return;
    setImporting(true);
    setImportMsg("");
    const res = await fetch("/api/jugadores/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`✅ ${data.created} jugadores importados/actualizados`);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      await loadJugadores();
    } else {
      setImportMsg("❌ Error al importar");
    }
    setImporting(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg border-2 border-black hover:bg-zinc-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Users size={22} className="text-[#0048FF]" />
          Jugadores
        </h1>
      </div>

      {/* Manual add */}
      <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Plus size={16} /> Agregar jugador
        </h2>
        <form onSubmit={agregarJugador} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Apellido"
              className="border-2 border-black rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <input
            type="number"
            min={1}
            max={99}
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número de camiseta (opcional)"
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={adding}
            className="bg-[#0048FF] text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-[#003ACC] text-sm disabled:opacity-50"
          >
            {adding ? "Agregando..." : "Agregar"}
          </button>
          {addMsg && <p className="text-sm">{addMsg}</p>}
        </form>
      </div>

      {/* CSV import */}
      <div className="border-2 border-black rounded-xl p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="font-bold mb-1 flex items-center gap-2">
          <Upload size={16} /> Importar desde CSV
        </h2>
        <p className="text-xs text-zinc-400 mb-4">
          Columnas: <code>Nombre, Apellido, Numero_de_camiseta</code>
        </p>
        <form onSubmit={importarJugadores} className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="w-full text-sm"
          />
          <button
            type="submit"
            disabled={importing || !csvText}
            className="bg-[#0048FF] text-white font-bold px-4 py-2 rounded-lg border-2 border-black hover:bg-[#003ACC] text-sm disabled:opacity-50"
          >
            {importing ? "Importando..." : "Importar"}
          </button>
          {importMsg && <p className="text-sm">{importMsg}</p>}
        </form>
      </div>

      {/* List */}
      {jugadores.length > 0 && (
        <div className="border-2 border-black rounded-xl bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-zinc-100 px-4 py-2 font-bold text-sm text-zinc-600">
            Plantel ({jugadores.length})
          </div>
          <ul className="divide-y divide-zinc-100">
            {jugadores.map((j) => (
              <li key={j.id} className="flex items-center px-4 py-2.5 gap-3">
                {j.numeroCamiseta !== null && (
                  <span className="w-8 h-8 rounded-full bg-[#0048FF] text-white text-xs flex items-center justify-center font-black shrink-0">
                    {j.numeroCamiseta}
                  </span>
                )}
                <span className="font-semibold text-sm">
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
