export const GAGAMOTO = "Gagamoto";

export type Standing = {
  nombre: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
};

type PartidoForStandings = {
  equipo1: string;
  equipo2: string;
  golesEquipo1: number | null;
  golesEquipo2: number | null;
};

export function computeStandings(partidos: PartidoForStandings[]): Standing[] {
  const teams: Record<string, Omit<Standing, "nombre" | "pj" | "pts">> = {};

  for (const p of partidos) {
    if (p.golesEquipo1 === null || p.golesEquipo2 === null) continue;
    const g1 = p.golesEquipo1;
    const g2 = p.golesEquipo2;

    if (!teams[p.equipo1]) teams[p.equipo1] = { pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
    if (!teams[p.equipo2]) teams[p.equipo2] = { pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };

    teams[p.equipo1].gf += g1;
    teams[p.equipo1].gc += g2;
    teams[p.equipo2].gf += g2;
    teams[p.equipo2].gc += g1;

    if (g1 > g2) {
      teams[p.equipo1].pg++;
      teams[p.equipo2].pp++;
    } else if (g1 < g2) {
      teams[p.equipo2].pg++;
      teams[p.equipo1].pp++;
    } else {
      teams[p.equipo1].pe++;
      teams[p.equipo2].pe++;
    }
  }

  return Object.entries(teams)
    .map(([nombre, s]) => ({
      nombre,
      pj: s.pg + s.pe + s.pp,
      pg: s.pg,
      pe: s.pe,
      pp: s.pp,
      gf: s.gf,
      gc: s.gc,
      pts: s.pg * 3 + s.pe,
    }))
    .sort((a, b) => b.pts - a.pts || b.gf - b.gc - (a.gf - a.gc));
}

/** Devuelve el torneo cuyo rango de fechas cubre hoy, o el más reciente */
export function getTorneoActivo<T extends { fechaInicio: Date; fechaFin: Date }>(
  torneos: T[]
): T | null {
  if (torneos.length === 0) return null;
  const hoy = new Date();
  const activo = torneos.find(
    (t) => new Date(t.fechaInicio) <= hoy && new Date(t.fechaFin) >= hoy
  );
  return activo ?? torneos[torneos.length - 1];
}

/** Para un partido, retorna los goles/resultado desde la perspectiva de Gagamoto */
export function resultadoGagamoto(partido: {
  equipo1: string;
  equipo2: string;
  golesEquipo1: number | null;
  golesEquipo2: number | null;
}): { gf: number; gc: number; resultado: "G" | "E" | "P" } | null {
  if (partido.golesEquipo1 === null || partido.golesEquipo2 === null) return null;
  const esEquipo1 = partido.equipo1 === GAGAMOTO;
  const gf = esEquipo1 ? partido.golesEquipo1 : partido.golesEquipo2;
  const gc = esEquipo1 ? partido.golesEquipo2 : partido.golesEquipo1;
  const resultado = gf > gc ? "G" : gf === gc ? "E" : "P";
  return { gf, gc, resultado };
}

/** Parsea un CSV simple (primera fila = headers, sep = coma) */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}
