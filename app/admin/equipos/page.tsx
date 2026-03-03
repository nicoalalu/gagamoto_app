"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

type Equipo = { id: string; nombre: string; logo: string | null };

export default function AdminEquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const photoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function loadEquipos() {
    const res = await fetch("/api/equipos");
    const data = await res.json();
    setEquipos(data);
  }

  useEffect(() => { loadEquipos(); }, []);

  async function subirLogo(equipoId: string, file: File) {
    setUploadingId(equipoId);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const blob = await upload(`equipos/${equipoId}.${ext}`, file, {
        access: "public",
        handleUploadUrl: `/api/equipos/${equipoId}/logo`,
      });

      const saveRes = await fetch(`/api/equipos/${equipoId}/logo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error ?? "Error al guardar el logo");
      }

      setEquipos((prev) =>
        prev.map((e) => (e.id === equipoId ? { ...e, logo: blob.url } : e))
      );
    } catch (err) {
      setUploadError(`Error al subir logo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploadingId(null);
    }
  }

  async function borrarLogo(equipoId: string) {
    setUploadingId(equipoId);
    await fetch(`/api/equipos/${equipoId}/logo`, { method: "DELETE" });
    setEquipos((prev) => prev.map((e) => (e.id === equipoId ? { ...e, logo: null } : e)));
    setUploadingId(null);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestionar logos de equipos</p>
        </div>
      </div>

      {uploadError && (
        <p className="text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {uploadError}
        </p>
      )}

      {equipos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
          No hay equipos cargados. Los equipos se crean automáticamente al importar partidos.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Equipos <span className="text-gray-400 font-normal">({equipos.length})</span>
            </h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {equipos.map((equipo) => (
              <li key={equipo.id} className="flex items-center px-5 py-3 gap-3">
                {/* Avatar / logo */}
                <div className="relative shrink-0 group">
                  {equipo.logo ? (
                    <Image
                      src={equipo.logo}
                      alt={equipo.nombre}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-gray-100"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {equipo.nombre.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => photoRefs.current[equipo.id]?.click()}
                    disabled={uploadingId === equipo.id}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity disabled:opacity-40"
                  >
                    {uploadingId === equipo.id
                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={13} className="text-white" />}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => { photoRefs.current[equipo.id] = el; }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) subirLogo(equipo.id, f); }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{equipo.nombre}</p>
                </div>

                {equipo.logo && (
                  <button
                    type="button"
                    onClick={() => borrarLogo(equipo.id)}
                    disabled={uploadingId === equipo.id}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    Quitar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
