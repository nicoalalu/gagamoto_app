import { auth } from "@/auth";
import Link from "next/link";
import { Settings, Calendar, Users, ClipboardList } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;

  const sections = [
    {
      href: "/admin/torneo",
      icon: Calendar,
      title: "Torneos y Fixture",
      desc: "Crear torneos e importar partidos desde CSV",
      color: "bg-[#0048FF]",
    },
    {
      href: "/admin/resultados",
      icon: ClipboardList,
      title: "Cargar Resultados",
      desc: "Registrar goles, tarjetas y MVP de partidos jugados",
      color: "bg-green-600",
    },
    {
      href: "/admin/jugadores",
      icon: Users,
      title: "Jugadores",
      desc: "Importar o gestionar el plantel desde CSV",
      color: "bg-zinc-800",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black flex items-center gap-2">
        <Settings className="text-[#0048FF]" size={24} />
        Admin
      </h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="border-2 border-black rounded-xl p-6 bg-white hover:bg-[#EEF3FF] transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3"
          >
            <div className={`${color} text-white w-10 h-10 rounded-xl flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
