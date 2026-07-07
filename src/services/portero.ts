// ENLACE - lado cliente del PORTERO (ENLACE-2). El invitado abre su link con
// ?llave=...; aqui se canjea en /api/portero por un pase firmado de Firebase
// (custom token con claims) y se inicia sesion. En visitas siguientes la
// sesion persiste y se restaura desde los claims, sin volver a canjear.

import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import type { SesionInvitado } from '../types';

interface RespuestaPortero {
  token: string;
  nombre: string;
  admisiones: number;
  grupos: string[];
}

// Canjea la llave en el portero. Lanza Error('llave_invalida') si no abre.
export async function canjearLlave(slug: string, llave: string): Promise<SesionInvitado> {
  const res = await fetch('/api/portero', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, llave }),
  });
  if (!res.ok) throw new Error('llave_invalida');
  const data = (await res.json()) as RespuestaPortero;

  const cred = await signInWithCustomToken(auth, data.token);
  const claims = (await cred.user.getIdTokenResult()).claims;

  return {
    eventoId: (claims.eventoId as string) ?? slug,
    invitadoId: (claims.invitadoId as string) ?? '',
    nombre: data.nombre,
    admisiones: data.admisiones,
    grupos: data.grupos,
  };
}

// Restaura la sesion de invitado si el usuario actual es un invitado DE ESTA
// boda. Devuelve null si no hay sesion, o si quien esta logueado es el
// operador/los novios (sus sesiones no se tocan).
export async function sesionInvitado(slug: string): Promise<SesionInvitado | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const claims = (await user.getIdTokenResult()).claims;
  if (claims.invitado !== true || claims.eventoId !== slug) return null;
  return {
    eventoId: claims.eventoId as string,
    invitadoId: (claims.invitadoId as string) ?? '',
    nombre: (claims.nombre as string) ?? '',
    admisiones: (claims.admisiones as number) ?? 1,
    grupos: (claims.grupos as string[]) ?? [],
  };
}

// ¿Hay alguien con sesion que NO es invitado (operador/novios)? En ese caso el
// canje automatico se salta para no pisar su sesion al previsualizar un link.
export async function haySesionDeGestion(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  const claims = (await user.getIdTokenResult()).claims;
  return claims.invitado !== true;
}
