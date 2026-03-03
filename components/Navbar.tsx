"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/partidos", label: "Partidos" },
  { href: "/rivales", label: "Rivales" },
  { href: "/estadisticas", label: "Stats" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between py-4 border-b border-gray-100">
      {/* Logo */}
      <Link href="/" className="text-sm font-semibold text-gray-900 tracking-tight">
        Gagamoto
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-5">
        {navItems.map(({ href, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors",
                active ? "text-gray-900 font-medium" : "text-gray-400 hover:text-gray-700"
              )}
            >
              {label}
            </Link>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
