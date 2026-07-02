// ENLACE - servicio de momentos (la linea de tiempo de la boda). Subcoleccion
// eventos/{eventoId}/momentos. Unica capa que toca Firestore para momentos.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Momento, MomentoInput } from '../types';

function col(eventoId: string) {
  return collection(db, 'eventos', eventoId, 'momentos');
}

function mapMomento(d: QueryDocumentSnapshot<DocumentData>): Momento {
  const raw = d.data();
  const ts = raw.createdAt as Timestamp | null;
  return {
    momentoId: d.id,
    eventoId: (raw.eventoId as string) ?? '',
    titulo: (raw.titulo as string) ?? '',
    tipo: (raw.tipo as string) ?? 'otro',
    fase: (raw.fase as Momento['fase']) ?? 'antes',
    fecha: raw.fecha as string | undefined,
    hora: raw.hora as string | undefined,
    lugar: raw.lugar as string | undefined,
    descripcion: raw.descripcion as string | undefined,
    orden: (raw.orden as number) ?? 0,
    visibilidad: (raw.visibilidad as Momento['visibilidad']) ?? 'privado',
    estado: (raw.estado as Momento['estado']) ?? 'planeado',
    createdAt: ts ? ts.toDate() : null,
  };
}

// Quita las claves opcionales sin valor (Firestore rechaza `undefined` y las
// reglas usan hasOnly: solo enviamos campos con contenido real).
function limpiar(input: Partial<MomentoInput>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== '') out[k] = v;
  }
  return out;
}

// Operador/owner: todos los momentos del evento, en orden.
export async function listarMomentos(eventoId: string): Promise<Momento[]> {
  const snap = await getDocs(query(col(eventoId), orderBy('orden', 'asc')));
  return snap.docs.map(mapMomento);
}

// Invitado (sin login): solo los momentos publicos, en orden.
export async function listarMomentosPublicos(eventoId: string): Promise<Momento[]> {
  const snap = await getDocs(
    query(col(eventoId), where('visibilidad', '==', 'publico'), orderBy('orden', 'asc')),
  );
  return snap.docs.map(mapMomento);
}

export async function crearMomento(eventoId: string, input: MomentoInput): Promise<void> {
  await addDoc(col(eventoId), { ...limpiar(input), eventoId, createdAt: serverTimestamp() });
}

export async function actualizarMomento(
  eventoId: string,
  momentoId: string,
  cambios: Partial<MomentoInput>,
): Promise<void> {
  await updateDoc(doc(db, 'eventos', eventoId, 'momentos', momentoId), limpiar(cambios));
}

export async function eliminarMomento(eventoId: string, momentoId: string): Promise<void> {
  await deleteDoc(doc(db, 'eventos', eventoId, 'momentos', momentoId));
}

// Intercambia el orden de dos momentos (botones subir/bajar), atomico.
export async function intercambiarOrden(eventoId: string, a: Momento, b: Momento): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, 'eventos', eventoId, 'momentos', a.momentoId), { orden: b.orden });
  batch.update(doc(db, 'eventos', eventoId, 'momentos', b.momentoId), { orden: a.orden });
  await batch.commit();
}
