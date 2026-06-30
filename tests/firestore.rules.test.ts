// ENLACE - tests de las reglas Firestore. Cubre los BLOQUEANTES del pre-mortem:
// aislamiento de tenant por eventoId, split publico/privado (no fuga de
// ownerUids), y escritura publica del invitado validada (anti-abuso del RSVP).
// Corren contra el emulador: `pnpm test:rules`.

import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

let env: RulesTestEnvironment;
const PROJECT = 'enlace-rules-test';

// Contextos.
function operador() {
  return env.authenticatedContext('romina', { operador: true }).firestore();
}
function ownerA() {
  return env.authenticatedContext('ownerA', { eventos: ['bodaA'] }).firestore();
}
function randomUser() {
  return env.authenticatedContext('intruso', {}).firestore();
}
function invitado() {
  return env.unauthenticatedContext().firestore();
}

const RSVP_OK = {
  nombre: 'Tia Rosa',
  asistencia: 'confirmado',
  numAcompanantes: 1,
  aceptoPolitica: true,
  politicaVersion: '2026-06-29',
  createdAt: serverTimestamp(),
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    // Boda A: publicada, con un owner.
    await setDoc(doc(db, 'eventos/bodaA'), {
      eventoId: 'bodaA',
      slug: 'bodaA',
      novios: { personaA: 'Maria', personaB: 'Juan' },
      fecha: '2026-12-12',
      lugar: { nombre: 'Hacienda' },
      mensajeInvitacion: 'Nos casamos',
      paleta: { acento: '#bb0c43' },
      ownerUids: ['ownerA'],
      plan: 'esencial',
      planRenovacion: { recurrente: true, estado: 'activa' },
      acceso: { modo: 'publico' },
      maxAcompanantesDefault: 2,
      estado: 'publicado',
      createdBy: 'romina',
      createdAt: new Date(),
    });
    await setDoc(doc(db, 'publicos/bodaA'), {
      eventoId: 'bodaA',
      slug: 'bodaA',
      novios: { personaA: 'Maria', personaB: 'Juan' },
      fecha: '2026-12-12',
      lugar: { nombre: 'Hacienda' },
      mensajeInvitacion: 'Nos casamos',
      maxAcompanantesDefault: 2,
      estado: 'publicado',
    });
    await setDoc(doc(db, 'eventos/bodaA/rsvps/semilla'), {
      nombre: 'Invitado Cero',
      asistencia: 'confirmado',
      numAcompanantes: 0,
      aceptoPolitica: true,
      politicaVersion: '2026-06-29',
      createdAt: new Date(),
    });
    // Boda B: en borrador (no publicada).
    await setDoc(doc(db, 'publicos/bodaB'), {
      eventoId: 'bodaB',
      slug: 'bodaB',
      novios: { personaA: 'Ana', personaB: 'Leo' },
      fecha: '2027-01-01',
      lugar: { nombre: 'Salon' },
      mensajeInvitacion: 'Pronto',
      maxAcompanantesDefault: 2,
      estado: 'borrador',
    });
  });
});

describe('aislamiento de tenant + split publico/privado', () => {
  it('el invitado (sin login) NO lee el doc de gestion (no fuga de ownerUids)', async () => {
    await assertFails(getDoc(doc(invitado(), 'eventos/bodaA')));
  });
  it('un usuario autenticado ajeno NO lee el doc de gestion de otra boda', async () => {
    await assertFails(getDoc(doc(randomUser(), 'eventos/bodaA')));
  });
  it('el owner SI lee su doc de gestion', async () => {
    await assertSucceeds(getDoc(doc(ownerA(), 'eventos/bodaA')));
  });
  it('el operador lee y lista todas las bodas', async () => {
    await assertSucceeds(getDoc(doc(operador(), 'eventos/bodaA')));
    await assertSucceeds(getDocs(collection(operador(), 'eventos')));
  });
  it('nadie puede enumerar la coleccion publicos (list denegado)', async () => {
    await assertFails(getDocs(collection(invitado(), 'publicos')));
  });
  it('cualquiera lee la proyeccion publica por id (la landing)', async () => {
    await assertSucceeds(getDoc(doc(invitado(), 'publicos/bodaA')));
  });
});

describe('gestion de eventos (solo operador en v0)', () => {
  it('el operador crea una boda valida', async () => {
    await assertSucceeds(
      setDoc(doc(operador(), 'eventos/nueva'), {
        eventoId: 'nueva',
        slug: 'nueva',
        novios: { personaA: 'C', personaB: 'D' },
        fecha: '2026-10-10',
        lugar: { nombre: 'Club' },
        mensajeInvitacion: 'Hola',
        ownerUids: ['ownerA'],
        plan: 'esencial',
        acceso: { modo: 'publico' },
        maxAcompanantesDefault: 3,
        estado: 'publicado',
        createdBy: 'romina',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('un usuario no-operador NO crea bodas', async () => {
    await assertFails(
      setDoc(doc(randomUser(), 'eventos/pirata'), {
        eventoId: 'pirata',
        slug: 'pirata',
        novios: { personaA: 'X', personaB: 'Y' },
        fecha: '2026-10-10',
        lugar: { nombre: 'Z' },
        mensajeInvitacion: 'Hola',
        ownerUids: ['intruso'],
        plan: 'esencial',
        acceso: { modo: 'publico' },
        maxAcompanantesDefault: 3,
        estado: 'publicado',
        createdBy: 'intruso',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('el slug es inmutable (no se puede reescribir)', async () => {
    await assertFails(updateDoc(doc(operador(), 'eventos/bodaA'), { slug: 'otra' }));
  });
  it('rechaza crear con campos no modelados (hasOnly)', async () => {
    await assertFails(
      setDoc(doc(operador(), 'eventos/sucia'), {
        eventoId: 'sucia',
        slug: 'sucia',
        novios: { personaA: 'A', personaB: 'B' },
        fecha: '2026-10-10',
        lugar: { nombre: 'X' },
        mensajeInvitacion: 'Hola',
        ownerUids: [],
        plan: 'esencial',
        acceso: { modo: 'publico' },
        maxAcompanantesDefault: 1,
        estado: 'publicado',
        createdBy: 'romina',
        createdAt: serverTimestamp(),
        esAdmin: true, // <- campo no modelado
      }),
    );
  });
});

describe('escalada de privilegios del owner (novio)', () => {
  it('el owner edita el contenido de SU boda (mensaje)', async () => {
    await assertSucceeds(
      updateDoc(doc(ownerA(), 'eventos/bodaA'), { mensajeInvitacion: 'Texto nuevo' }),
    );
  });
  it('el owner NO puede subir su propio plan', async () => {
    await assertFails(updateDoc(doc(ownerA(), 'eventos/bodaA'), { plan: 'lujo' }));
  });
  it('el owner NO puede alterar ownerUids (anadirse complices)', async () => {
    await assertFails(
      updateDoc(doc(ownerA(), 'eventos/bodaA'), { ownerUids: ['ownerA', 'intruso'] }),
    );
  });
  it('el owner NO puede tocar la renovacion del plan', async () => {
    await assertFails(
      updateDoc(doc(ownerA(), 'eventos/bodaA'), {
        planRenovacion: { recurrente: false, estado: 'activa' },
      }),
    );
  });
  it('el operador SI puede cambiar el plan', async () => {
    await assertSucceeds(updateDoc(doc(operador(), 'eventos/bodaA'), { plan: 'lujo' }));
  });
});

describe('RSVP del invitado (escritura publica validada)', () => {
  it('el invitado confirma con datos validos', async () => {
    await assertSucceeds(setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r1'), RSVP_OK));
  });
  it('rechaza mas acompanantes que el tope del evento', async () => {
    await assertFails(
      setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r2'), { ...RSVP_OK, numAcompanantes: 9 }),
    );
  });
  it('rechaza un valor de asistencia invalido', async () => {
    await assertFails(
      setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r3'), { ...RSVP_OK, asistencia: 'quiza' }),
    );
  });
  it('rechaza campos no permitidos (whitelist)', async () => {
    await assertFails(
      setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r4'), { ...RSVP_OK, esAdmin: true }),
    );
  });
  it('rechaza si no acepta la politica (LOPDP)', async () => {
    await assertFails(
      setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r5'), { ...RSVP_OK, aceptoPolitica: false }),
    );
  });
  it('rechaza confirmar a una boda no publicada', async () => {
    await assertFails(setDoc(doc(invitado(), 'eventos/bodaB/rsvps/r6'), RSVP_OK));
  });
  it('el invitado NO puede leer la lista de confirmaciones', async () => {
    await assertFails(getDocs(collection(invitado(), 'eventos/bodaA/rsvps')));
  });
  it('el operador SI lee las confirmaciones en su panel', async () => {
    await assertSucceeds(getDocs(collection(operador(), 'eventos/bodaA/rsvps')));
  });
  it('el owner SI lee las confirmaciones de su boda', async () => {
    await assertSucceeds(getDocs(collection(ownerA(), 'eventos/bodaA/rsvps')));
  });
  it('un RSVP es inmutable (no se edita ni se borra)', async () => {
    await assertFails(
      updateDoc(doc(invitado(), 'eventos/bodaA/rsvps/semilla'), { numAcompanantes: 99 }),
    );
    await assertFails(deleteDoc(doc(invitado(), 'eventos/bodaA/rsvps/semilla')));
  });
});
