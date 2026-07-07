// ENLACE - servicio de INVITADOS (la lista con llave, ENLACE-2). Subcoleccion
// eventos/{eventoId}/invitados. PRIVADA: solo operador/owners; el invitado
// jamas lee estos docs (entra por el portero /api/portero).
//
// La llave (token) se genera aqui con crypto y viaja en el link del invitado.
// Vive en este doc privado para poder recopiarla/reimprimirla (QR) cuando la
// pareja lo necesite; las reglas garantizan que solo operador/owners la leen.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Invitado } from '../types';

function col(eventoId: string) {
  return collection(db, 'eventos', eventoId, 'invitados');
}

// ---- La llave: 28 caracteres base62 al azar (~166 bits). Inadivinable. ----
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generarLlave(): string {
  const bytes = new Uint8Array(28);
  crypto.getRandomValues(bytes);
  let llave = '';
  for (const b of bytes) llave += ALFABETO[b % ALFABETO.length];
  return llave;
}

function mapInvitado(d: QueryDocumentSnapshot<DocumentData>): Invitado {
  const raw = d.data();
  const ts = raw.createdAt as Timestamp | null;
  return {
    invitadoId: d.id,
    eventoId: (raw.eventoId as string) ?? '',
    nombre: (raw.nombre as string) ?? '',
    admisiones: (raw.admisiones as number) ?? 1,
    grupos: (raw.grupos as string[]) ?? [],
    token: (raw.token as string) ?? '',
    estado: (raw.estado as Invitado['estado']) ?? 'activo',
    createdAt: ts ? ts.toDate() : null,
  };
}

// Escucha en tiempo real la lista de invitados de una boda (panel).
export function escucharInvitados(
  eventoId: string,
  onData: (invitados: Invitado[]) => void,
  onError: (e: Error) => void,
): () => void {
  const q = query(col(eventoId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => onData(snap.docs.map(mapInvitado)), onError);
}

// Crea un invitado con su llave recien acunada.
export async function crearInvitado(
  eventoId: string,
  datos: { nombre: string; admisiones: number; grupos: string[] },
): Promise<void> {
  await addDoc(col(eventoId), {
    eventoId,
    nombre: datos.nombre.trim(),
    admisiones: Math.max(1, Math.trunc(datos.admisiones)),
    grupos: datos.grupos,
    token: generarLlave(),
    estado: 'activo',
    createdAt: serverTimestamp(),
  });
}

// Alta EN LOTE (import de Excel). Escribe en batches de 500 (limite duro de
// Firestore); cada invitado nace con su propia llave y estado activo. Mismo
// documento que crearInvitado: no cambia la forma ni las reglas. Devuelve
// cuantos se crearon.
export async function crearInvitadosEnLote(
  eventoId: string,
  filas: { nombre: string; admisiones: number; grupos: string[] }[],
): Promise<number> {
  const TAMANO_LOTE = 500;
  let creados = 0;
  for (let i = 0; i < filas.length; i += TAMANO_LOTE) {
    const batch = writeBatch(db);
    for (const fila of filas.slice(i, i + TAMANO_LOTE)) {
      batch.set(doc(col(eventoId)), {
        eventoId,
        nombre: fila.nombre.trim(),
        admisiones: Math.max(1, Math.min(21, Math.trunc(fila.admisiones))),
        grupos: fila.grupos,
        token: generarLlave(),
        estado: 'activo',
        createdAt: serverTimestamp(),
      });
      creados += 1;
    }
    await batch.commit();
  }
  return creados;
}

export async function actualizarInvitado(
  eventoId: string,
  invitadoId: string,
  cambios: Partial<Pick<Invitado, 'nombre' | 'admisiones' | 'grupos'>>,
): Promise<void> {
  await updateDoc(doc(db, 'eventos', eventoId, 'invitados', invitadoId), cambios);
}

// Revoca la llave: el portero deja de aceptarla de inmediato.
export async function revocarLlave(eventoId: string, invitadoId: string): Promise<void> {
  await updateDoc(doc(db, 'eventos', eventoId, 'invitados', invitadoId), {
    estado: 'revocado',
  });
}

// Regenera: acuna una llave nueva y reactiva (la vieja muere al instante).
export async function regenerarLlave(eventoId: string, invitadoId: string): Promise<void> {
  await updateDoc(doc(db, 'eventos', eventoId, 'invitados', invitadoId), {
    token: generarLlave(),
    estado: 'activo',
  });
}

export async function eliminarInvitado(eventoId: string, invitadoId: string): Promise<void> {
  await deleteDoc(doc(db, 'eventos', eventoId, 'invitados', invitadoId));
}

// ---- Entrega de la llave ----
export function linkDeInvitado(slug: string, token: string): string {
  return `${window.location.origin}/b/${slug}?llave=${token}`;
}

export function linkWhatsApp(nombre: string, personaA: string, personaB: string, link: string): string {
  const texto =
    `Hola ${nombre}, ${personaA} y ${personaB} te invitan a su boda. ` +
    `Esta es tu invitación personal: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
