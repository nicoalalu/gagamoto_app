"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Trophy, Calendar, BarChart2, Swords, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio", icon: Trophy },
  { href: "/fixture", label: "Fixture", icon: Calendar },
  { href: "/rivales", label: "Rivales", icon: Swords },
  { href: "/estadisticas", label: "Stats", icon: BarChart2 },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[#0048FF] border-b-4 border-black shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-white text-xl tracking-tight">
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
                pathname === href || (href !== "/" && pathname.startsWith(href))
                  ? "bg-white text-[#0048FF]"
                  : "text-white hover:bg-white/20"
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
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/20 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex border-t border-white/20">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-semibold transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-white text-[#0048FF]"
                : "text-white hover:bg-white/20"
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
