// ENLACE - servicio de RSVPs. La escritura la hace el invitado SIN login
// (superficie publica): la barrera real son las reglas + App Check, no esta capa.

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Rsvp, RsvpInput } from '../types';

// Crea el RSVP del invitado. numAcompanantes se fuerza a entero (las reglas
// exigen `is int`). El tope real se valida server-side contra el evento.
export async function crearRsvp(eventoId: string, input: RsvpInput): Promise<void> {
  const data: Record<string, unknown> = {
    nombre: input.nombre.trim(),
    asistencia: input.asistencia,
    numAcompanantes: Math.trunc(input.numAcompanantes),
    aceptoPolitica: input.aceptoPolitica,
    politicaVersion: input.politicaVersion,
    createdAt: serverTimestamp(),
  };
  const mensaje = input.mensaje?.trim();
  if (mensaje) data.mensaje = mensaje;
  await addDoc(collection(db, 'eventos', eventoId, 'rsvps'), data);
}

// Escucha en tiempo real los RSVPs de un evento (panel del operador/novios).
// Listener acotado al evento: 1 evento = 1 listener, nunca toda la coleccion.
export function escucharRsvps(
  eventoId: string,
  onData: (rsvps: Rsvp[]) => void,
  onError: (e: Error) => void,
): () => void {
  const q = query(collection(db, 'eventos', eventoId, 'rsvps'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const rsvps: Rsvp[] = snap.docs.map((d) => {
        const raw = d.data();
        const ts = raw.createdAt as Timestamp | null;
        return {
          rsvpId: d.id,
          nombre: (raw.nombre as string) ?? '',
          asistencia: (raw.asistencia as Rsvp['asistencia']) ?? 'confirmado',
          numAcompanantes: (raw.numAcompanantes as number) ?? 0,
          mensaje: raw.mensaje as string | undefined,
          aceptoPolitica: (raw.aceptoPolitica as boolean) ?? false,
          politicaVersion: (raw.politicaVersion as string) ?? '',
          createdAt: ts ? ts.toDate() : null,
        };
      });
      onData(rsvps);
    },
    (err) => onError(err),
  );
}
