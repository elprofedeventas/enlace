// ENLACE - mensajes de la ultima semana (dias 7 a 1 antes de la boda).
// La cuenta regresiva los muestra como "Faltan X días para… {mensaje}".
//
// Coleccion de fabrica: 21 mensajes en tres tonos. Por defecto, cada boda
// "baraja el mazo" de forma DETERMINISTICA usando su slug como semilla: saca
// 7 cartas sin repetir y las asigna del dia 7 al dia 1. Asi, todos los
// invitados ven el mismo mensaje el mismo dia, recargar la pagina no lo
// cambia, y cada boda tiene una secuencia distinta. Sin tocar la base de
// datos. Cuando exista el panel de novios (ENLACE-3), la pareja podra elegir
// sus 7 y el orden; esa eleccion reemplazara a la baraja.

export const MENSAJES_ULTIMA_SEMANA: string[] = [
  // Tono clasico elegante
  'que comience la historia más esperada.',
  'el sí que lo cambia todo.',
  'la celebración de una promesa.',
  'que dos nombres se escriban juntos para siempre.',
  'el día que llevará sus nombres.',
  'brindar por el amor que nos reúne.',
  'que la espera se convierta en recuerdo.',
  // Tono romantico poetico
  'que dos caminos se vuelvan uno.',
  'que el amor se vista de gala.',
  'la primera página de su para siempre.',
  'que una promesa se haga eterna.',
  'el abrazo que sella una vida entera.',
  'que el corazón llegue a casa.',
  'el momento en que el tiempo se detenga.',
  // Tono calido cercano
  'compartir la mesa, el baile y la alegría.',
  'verlos decir "sí" rodeados de los suyos.',
  'la fiesta que recordaremos toda la vida.',
  'celebrar juntos el amor de estos dos.',
  'que suene la música y empiece la magia.',
  'el día que hemos soñado tanto.',
  'abrazar a los novios y celebrar en grande.',
];

// ---- La baraja deterministica ----
// Semilla numerica a partir del slug (hash djb2: simple y estable).
function semillaDe(texto: string): number {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) {
    h = (h * 33) ^ texto.charCodeAt(i);
  }
  return h >>> 0;
}

// Generador pseudoaleatorio con semilla (mulberry32): misma semilla, misma
// secuencia, en cualquier dispositivo y para siempre.
function generadorCon(semilla: number): () => number {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Baraja (Fisher-Yates) el mazo completo con la mano de esta boda y devuelve
// las 7 cartas de la semana. Indice 0 = dia 7, indice 6 = dia 1.
export function mensajesDeLaBoda(slug: string): string[] {
  const mazo = [...MENSAJES_ULTIMA_SEMANA];
  const azar = generadorCon(semillaDe(slug));
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    const carta = mazo[i]!;
    mazo[i] = mazo[j]!;
    mazo[j] = carta;
  }
  return mazo.slice(0, 7);
}

// Mensaje para un dia concreto de la ultima semana (7..1).
export function mensajeDelDia(slug: string, diasRestantes: number): string | null {
  if (diasRestantes < 1 || diasRestantes > 7) return null;
  const semana = mensajesDeLaBoda(slug);
  return semana[7 - diasRestantes] ?? null;
}
