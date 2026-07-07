// ENLACE - servicio de RSVPs. La escritura la hace el invitado SIN login
// (superficie publica): la barrera real son las reglas + App Check, no esta capa.

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

// ---- ENLACE-2: RSVP del invitado con pase ----
// Su confirmacion vive en el doc con id == invitadoId (una por llave). Puede
// cambiar de opinion: si ya existe, se actualiza sin tocar createdAt (las
// reglas lo exigen sellado).

export async function leerRsvpDeInvitado(
  eventoId: string,
  invitadoId: string,
): Promise<Rsvp | null> {
  const snap = await getDoc(doc(db, 'eventos', eventoId, 'rsvps', invitadoId));
  if (!snap.exists()) return null;
  const raw = snap.data();
  const ts = raw.createdAt as Timestamp | null;
  return {
    rsvpId: snap.id,
    nombre: (raw.nombre as string) ?? '',
    asistencia: (raw.asistencia as Rsvp['asistencia']) ?? 'confirmado',
    numAcompanantes: (raw.numAcompanantes as number) ?? 0,
    mensaje: raw.mensaje as string | undefined,
    aceptoPolitica: (raw.aceptoPolitica as boolean) ?? false,
    politicaVersion: (raw.politicaVersion as string) ?? '',
    createdAt: ts ? ts.toDate() : null,
  };
}

export async function confirmarComoInvitado(
  eventoId: string,
  invitadoId: string,
  input: RsvpInput,
  yaExiste: boolean,
): Promise<void> {
  const data: Record<string, unknown> = {
    nombre: input.nombre.trim(),
    asistencia: input.asistencia,
    numAcompanantes: Math.trunc(input.numAcompanantes),
    aceptoPolitica: input.aceptoPolitica,
    politicaVersion: input.politicaVersion,
  };
  const mensaje = input.mensaje?.trim();
  if (mensaje) data.mensaje = mensaje;

  const ref = doc(db, 'eventos', eventoId, 'rsvps', invitadoId);
  if (yaExiste) {
    await updateDoc(ref, data);
  } else {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() });
  }
}
