"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Swords,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/partidos", label: "Partidos", icon: CalendarDays },
  { href: "/rivales", label: "Rivales", icon: Swords },
  { href: "/estadisticas", label: "Stats", icon: BarChart2 },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Sidebar (md+) ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-full w-52 bg-white border-r border-gray-100 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="text-sm font-semibold text-gray-900 tracking-tight">
            Gagamoto
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                )}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors w-full"
          >
            <LogOut size={16} strokeWidth={1.8} />
            Salir
          </button>
        </div>
      </aside>

      {/* ── Bottom nav (mobile) ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors",
                active ? "text-gray-900 font-medium" : "text-gray-400 hover:text-gray-700"
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Salir
        </button>
      </nav>
    </>
  );
}
