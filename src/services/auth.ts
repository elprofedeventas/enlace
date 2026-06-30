// ENLACE - servicio de autenticacion (email + contrasena + custom claims).
// Toda interaccion con Firebase Auth pasa por aqui; paginas/contextos nunca
// importan firebase/auth directamente. En v0 los claims se siembran con el
// script admin (scripts/set-operador-claim.mjs); el flujo api/login para novios
// es roadmap #1.

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { Claims } from '../types';

// Largo minimo de contrasena exigido por la app (Firebase exige >= 6).
export const MIN_PASSWORD = 8;

// Suscribe a los cambios de sesion. Devuelve la funcion para desuscribir.
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Inicia sesion con email + contrasena.
export async function entrar(email: string, password: string): Promise<FirebaseUser> {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user;
}

// Lee los custom claims (operador, eventos) del ID token. forceRefresh tras un
// cambio de rol hecho server-side. Devuelve SIEMPRE un objeto (vacio si no hay).
export async function leerClaims(user: FirebaseUser, forceRefresh = false): Promise<Claims> {
  const res = await user.getIdTokenResult(forceRefresh);
  const operador = res.claims.operador === true;
  const eventos = Array.isArray(res.claims.eventos) ? (res.claims.eventos as string[]) : [];
  return { operador, eventos };
}

// Envia el correo para restablecer la contrasena.
export function recuperarPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

// Cierra la sesion del usuario actual.
export function logout(): Promise<void> {
  return signOut(auth);
}
