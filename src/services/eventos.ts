// ENLACE - servicio de eventos (el tenant). Unica capa que toca Firestore para
// eventos. Modelo de 3 docs: eventos/{id} (gestion privada) + publicos/{id}
// (proyeccion publica de la invitacion) + eventos/{id}/rsvps. id == slug.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Evento, EventoPublico, ModoAcceso, Plan } from '../types';

const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export function normalizarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos (marcas diacriticas)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export interface NuevoEvento {
  slug: string;
  personaA: string;
  personaB: string;
  fecha: string; // ISO date
  lugarNombre: string;
  lugarDireccion?: string;
  mensajeInvitacion: string;
  acento?: string;
  maxAcompanantesDefault: number;
  portadaUrl?: string;
}

// Campos que van a la proyeccion publica (no sensibles). Sella el contrato del
// split publico/privado en un solo lugar.
function proyeccionPublica(evento: Evento): Omit<EventoPublico, never> {
  const pub: EventoPublico = {
    eventoId: evento.eventoId,
    slug: evento.slug,
    novios: evento.novios,
    fecha: evento.fecha,
    lugar: evento.lugar,
    mensajeInvitacion: evento.mensajeInvitacion,
    maxAcompanantesDefault: evento.maxAcompanantesDefault,
    estado: evento.estado,
  };
  if (evento.portadaUrl) pub.portadaUrl = evento.portadaUrl;
  if (evento.paleta) pub.paleta = evento.paleta;
  return pub;
}

// Crea el evento (publicado en v0) + su proyeccion publica de forma atomica.
// El slug es la llave: si ya existe, falla con 'slug_en_uso'.
export async function crearEvento(input: NuevoEvento, ownerUid: string): Promise<string> {
  const slug = input.slug;
  if (!SLUG_RE.test(slug)) throw new Error('slug_invalido');

  const evRef = doc(db, 'eventos', slug);
  const pubRef = doc(db, 'publicos', slug);

  const plan: Plan = 'esencial';
  const modo: ModoAcceso = 'publico'; // decision de producto: slug + nombre

  const evento: Evento = {
    eventoId: slug,
    slug,
    novios: { personaA: input.personaA.trim(), personaB: input.personaB.trim() },
    fecha: input.fecha,
    lugar: {
      nombre: input.lugarNombre.trim(),
      ...(input.lugarDireccion ? { direccion: input.lugarDireccion.trim() } : {}),
    },
    mensajeInvitacion: input.mensajeInvitacion.trim(),
    ...(input.portadaUrl ? { portadaUrl: input.portadaUrl } : {}),
    paleta: { acento: input.acento || '#bb0c43' },
    ownerUids: [ownerUid],
    plan,
    planRenovacion: { recurrente: true, estado: 'activa' },
    acceso: { modo },
    maxAcompanantesDefault: input.maxAcompanantesDefault,
    estado: 'publicado',
    createdBy: ownerUid,
  };

  await runTransaction(db, async (tx) => {
    const existe = await tx.get(evRef);
    if (existe.exists()) throw new Error('slug_en_uso');
    tx.set(evRef, { ...evento, createdAt: serverTimestamp() });
    tx.set(pubRef, proyeccionPublica(evento));
  });

  return slug;
}

// Lista los eventos visibles. El operador los ve todos (regla: list si operador).
export async function listarEventos(): Promise<Evento[]> {
  const q = query(collection(db, 'eventos'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Evento);
}

// Lee un evento de gestion por id (operador/owner). Para el panel.
export async function getEvento(eventoId: string): Promise<Evento | null> {
  const snap = await getDoc(doc(db, 'eventos', eventoId));
  return snap.exists() ? (snap.data() as Evento) : null;
}

// Lee la proyeccion publica por slug (landing del invitado, sin login).
export async function getEventoPublico(slug: string): Promise<EventoPublico | null> {
  const snap = await getDoc(doc(db, 'publicos', slug));
  return snap.exists() ? (snap.data() as EventoPublico) : null;
}
