import { auth } from "@/auth";
import Link from "next/link";
import { Settings, Calendar, Users, ClipboardList, Shield } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  if (!session) return null;

  const sections = [
    {
      href: "/admin/torneo",
      icon: Calendar,
      title: "Torneos y Fixture",
      desc: "Crear torneos e importar partidos desde CSV",
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      href: "/admin/resultados",
      icon: ClipboardList,
      title: "Cargar Resultados",
      desc: "Registrar goles, tarjetas y MVP de partidos jugados",
      iconClass: "bg-green-50 text-green-600",
    },
    {
      href: "/admin/jugadores",
      icon: Users,
      title: "Jugadores",
      desc: "Importar o gestionar el plantel desde CSV",
      iconClass: "bg-gray-100 text-gray-600",
    },
    {
      href: "/admin/equipos",
      icon: Shield,
      title: "Equipos",
      desc: "Subir logos de los equipos del torneo",
      iconClass: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={22} className="text-gray-400" />
          Admin
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión del equipo y torneos</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map(({ href, icon: Icon, title, desc, iconClass }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:bg-gray-50 transition-colors space-y-3"
          >
            <div className={`${iconClass} w-10 h-10 rounded-xl flex items-center justify-center`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
