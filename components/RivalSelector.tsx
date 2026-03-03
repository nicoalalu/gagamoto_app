"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function RivalSelector({
  rivales,
  selected,
}: {
  rivales: string[];
  selected: string | null;
}) {
  const router = useRouter();

  return (
    <div className="relative">
      <select
        value={selected ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          router.push(val ? `/rivales?rival=${encodeURIComponent(val)}` : "/rivales");
        }}
        className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
      >
        <option value="">Seleccionar rival...</option>
        {rivales.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}
