import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gagamoto Manager",
  description: "Gestión del equipo de fútbol amateur Gagamoto",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-zinc-50 text-black`}>
        <Providers>
          {session && <Navbar />}
          <div className={session ? "md:pl-52" : ""}>
            <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
