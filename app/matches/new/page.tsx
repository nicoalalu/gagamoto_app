"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      date: (form.elements.namedItem("date") as HTMLInputElement).value,
      opponent: (form.elements.namedItem("opponent") as HTMLInputElement).value,
    };

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const match = await res.json();
      router.push(`/matches/${match.id}`);
    } else {
      const err = await res.json();
      setError(err.error ?? "Error al crear el partido");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/matches" className="p-2 rounded-lg hover:bg-zinc-100 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black">Nuevo partido</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-black rounded-xl p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="space-y-1.5">
          <label className="text-sm font-bold" htmlFor="date">
            Fecha y hora
          </label>
          <input
            id="date"
            name="date"
            type="datetime-local"
            required
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold" htmlFor="opponent">
            Rival
          </label>
          <input
            id="opponent"
            name="opponent"
            type="text"
            required
            placeholder="Nombre del rival"
            className="w-full border-2 border-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 border-2 border-black rounded-xl py-3 font-bold text-sm hover:bg-yellow-500 disabled:opacity-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5"
        >
          {loading ? "Creando..." : "Crear partido"}
        </button>
      </form>
    </div>
  );
}
