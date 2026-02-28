"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Trophy, Calendar, BarChart2, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: Trophy },
  { href: "/matches", label: "Partidos", icon: Calendar },
  { href: "/stats", label: "Estadísticas", icon: BarChart2 },
  { href: "/players", label: "Jugadores", icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-yellow-400 border-b-4 border-black shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-black text-xl tracking-tight">
          <Trophy size={24} />
          <span>Gagamoto</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                pathname === href
                  ? "bg-black text-yellow-400"
                  : "text-black hover:bg-black/10"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-black hover:bg-black/10 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-black/20">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors",
              pathname === href
                ? "bg-black text-yellow-400"
                : "text-black hover:bg-black/10"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
