// ENLACE - tema de la invitacion. El tema es DATA, no codigo: cada boda trae su
// `paleta.acento` y aqui se traduce a variables CSS que visten a todos los
// componentes de la invitacion. Los componentes leen las variables y no saben
// que tema los viste (analogia del teatro: mismos actores, otra escenografia).
//
// Usa color-mix() (CSS moderno, soportado en todos los navegadores actuales)
// para derivar tintes y sombras del acento sin matematica de color en JS.

import type { CSSProperties } from 'react';

export function temaInvitacion(acento: string): CSSProperties {
  return {
    // Acento crudo de la pareja.
    '--boda-acento': acento,
    // Tinte muy suave para fondos y halos decorativos.
    '--boda-halo': `color-mix(in srgb, ${acento} 14%, transparent)`,
    // Tinte medio para bordes y ornamentos.
    '--boda-linea': `color-mix(in srgb, ${acento} 38%, var(--enlace-border))`,
    // Version "tinta": el acento asentado sobre el texto, para titulos.
    '--boda-tinta': `color-mix(in srgb, ${acento} 60%, var(--enlace-text))`,
    // Relleno suave para nodos/chips.
    '--boda-relleno': `color-mix(in srgb, ${acento} 18%, var(--enlace-surface))`,
  } as CSSProperties;
}

// Iniciales para el monograma-sello: primera letra de cada nombre.
export function iniciales(personaA: string, personaB: string): [string, string] {
  const ini = (s: string) => (s.trim().charAt(0) || '·').toUpperCase();
  return [ini(personaA), ini(personaB)];
}

// "2026-11-14" -> "sabado, 14 de noviembre de 2026" (con mayuscula inicial).
// La fecha ISO se parsea como LOCAL (no UTC) para no correrse un dia.
export function fechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  const fecha = new Date(y, m - 1, d);
  const texto = new Intl.DateTimeFormat('es-EC', { dateStyle: 'full' }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Fecha corta para nodos de la linea de tiempo: "14 nov".
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(
    new Date(y, m - 1, d),
  );
}
