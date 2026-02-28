import { addHours, isAfter } from "date-fns";

/**
 * Verifica si la ventana de votación/rating está abierta.
 * La ventana cierra 24 horas después de la fecha del partido.
 */
export function isVotingWindowOpen(matchDate: Date): boolean {
  const deadline = addHours(new Date(matchDate), 24);
  return !isAfter(new Date(), deadline);
}

/**
 * Verifica si el partido ya jugó (fecha pasada).
 */
export function isMatchPlayed(matchDate: Date): boolean {
  return isAfter(new Date(), new Date(matchDate));
}

/**
 * Verifica si el partido es futuro (se puede editar asistencia).
 */
export function isMatchFuture(matchDate: Date): boolean {
  return !isAfter(new Date(), new Date(matchDate));
}

/**
 * Formatea una fecha en formato legible en español.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea fecha corta.
 */
export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
