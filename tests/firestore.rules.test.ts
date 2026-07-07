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
  query,
  where,
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
// Invitado CON PASE del portero (ENLACE-2): claims firmados en el custom token.
function invitadaConLlave(grupos: string[] = ['bridal'], admisiones = 3) {
  return env
    .authenticatedContext('inv-bodaA-maju', {
      invitado: true,
      eventoId: 'bodaA',
      invitadoId: 'maju',
      nombre: 'Maria Jose',
      admisiones,
      grupos,
    })
    .firestore();
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
    // Momentos: uno publico (civil) y uno privado (bridal shower).
    await setDoc(doc(db, 'eventos/bodaA/momentos/civil'), {
      eventoId: 'bodaA',
      titulo: 'Matrimonio Civil',
      tipo: 'civil',
      fase: 'dia',
      orden: 60,
      visibilidad: 'publico',
      estado: 'planeado',
      createdAt: new Date(),
    });
    await setDoc(doc(db, 'eventos/bodaA/momentos/bridal'), {
      eventoId: 'bodaA',
      titulo: 'Bridal Shower',
      tipo: 'bridal-shower',
      fase: 'antes',
      orden: 30,
      visibilidad: 'privado',
      estado: 'planeado',
      createdAt: new Date(),
    });
    // Momento por GRUPOS: solo lo ve la audiencia 'bridal' (ENLACE-2).
    await setDoc(doc(db, 'eventos/bodaA/momentos/te'), {
      eventoId: 'bodaA',
      titulo: 'Tarde de te',
      tipo: 'bridal-shower',
      fase: 'antes',
      orden: 35,
      visibilidad: 'grupos',
      audiencias: ['bridal'],
      estado: 'planeado',
      createdAt: new Date(),
    });
    // Invitada en la lista privada (con su llave).
    await setDoc(doc(db, 'eventos/bodaA/invitados/maju'), {
      eventoId: 'bodaA',
      nombre: 'Maria Jose',
      admisiones: 3,
      grupos: ['bridal'],
      token: 'LLAVEDEPRUEBA1234567890abcd',
      estado: 'activo',
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

describe('momentos (linea de tiempo)', () => {
  const MOMENTO_OK = {
    eventoId: 'bodaA',
    titulo: 'La sesion de fotos',
    tipo: 'sesion-fotos',
    fase: 'antes',
    orden: 50,
    visibilidad: 'publico',
    estado: 'planeado',
    createdAt: serverTimestamp(),
  };

  it('el invitado ve un momento PUBLICO por id', async () => {
    await assertSucceeds(getDoc(doc(invitado(), 'eventos/bodaA/momentos/civil')));
  });
  it('el invitado NO ve un momento PRIVADO', async () => {
    await assertFails(getDoc(doc(invitado(), 'eventos/bodaA/momentos/bridal')));
  });
  it('el invitado lista solo los momentos publicos (query filtrada)', async () => {
    await assertSucceeds(
      getDocs(query(collection(invitado(), 'eventos/bodaA/momentos'), where('visibilidad', '==', 'publico'))),
    );
  });
  it('el invitado NO puede listar TODOS los momentos (incluiria privados)', async () => {
    await assertFails(getDocs(collection(invitado(), 'eventos/bodaA/momentos')));
  });
  it('el invitado NO puede crear momentos', async () => {
    await assertFails(setDoc(doc(invitado(), 'eventos/bodaA/momentos/pirata'), MOMENTO_OK));
  });
  it('el operador crea un momento valido', async () => {
    await assertSucceeds(setDoc(doc(operador(), 'eventos/bodaA/momentos/nuevo'), MOMENTO_OK));
  });
  it('el operador rechaza un momento con fase invalida', async () => {
    await assertFails(
      setDoc(doc(operador(), 'eventos/bodaA/momentos/malo'), { ...MOMENTO_OK, fase: 'cuando-sea' }),
    );
  });
  it('el operador rechaza un momento con campo no modelado (hasOnly)', async () => {
    await assertFails(
      setDoc(doc(operador(), 'eventos/bodaA/momentos/sucio'), { ...MOMENTO_OK, secreto: 'x' }),
    );
  });
  it('el owner gestiona y borra momentos de SU boda', async () => {
    await assertSucceeds(
      updateDoc(doc(ownerA(), 'eventos/bodaA/momentos/civil'), { estado: 'realizado' }),
    );
    await assertSucceeds(deleteDoc(doc(ownerA(), 'eventos/bodaA/momentos/bridal')));
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


// ==== ENLACE-2: la cerradura (invitados con llave, grupos, RSVP con cupo) ====

const RSVP_LLAVE_OK = {
  nombre: 'Maria Jose',
  asistencia: 'confirmado',
  numAcompanantes: 2, // admisiones 3 = ella + 2
  aceptoPolitica: true,
  politicaVersion: '2026-06-29',
  createdAt: serverTimestamp(),
};

describe('ENLACE-2: lista privada de invitados', () => {
  it('nadie sin gestion lee la lista (ahi viven las llaves)', async () => {
    await assertFails(getDoc(doc(invitado(), 'eventos/bodaA/invitados/maju')));
    await assertFails(getDocs(collection(randomUser(), 'eventos/bodaA/invitados')));
    await assertFails(getDoc(doc(invitadaConLlave(), 'eventos/bodaA/invitados/maju')));
  });
  it('operador y owner administran la lista', async () => {
    await assertSucceeds(getDocs(collection(operador(), 'eventos/bodaA/invitados')));
    await assertSucceeds(
      setDoc(doc(ownerA(), 'eventos/bodaA/invitados/tio'), {
        eventoId: 'bodaA',
        nombre: 'Tio Pepe',
        admisiones: 2,
        grupos: [],
        token: 'OTRALLAVEDEPRUEBA0987654321',
        estado: 'activo',
        createdAt: serverTimestamp(),
      }),
    );
  });
  it('rechaza invitados con forma invalida (campo extra / llave corta)', async () => {
    await assertFails(
      setDoc(doc(operador(), 'eventos/bodaA/invitados/malo'), {
        eventoId: 'bodaA',
        nombre: 'Malo',
        admisiones: 2,
        grupos: [],
        token: 'corta',
        estado: 'activo',
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(operador(), 'eventos/bodaA/invitados/malo2'), {
        eventoId: 'bodaA',
        nombre: 'Malo',
        admisiones: 2,
        grupos: [],
        token: 'OTRALLAVEDEPRUEBA0987654321',
        estado: 'activo',
        sorpresa: true,
        createdAt: serverTimestamp(),
      }),
    );
  });
});

describe('ENLACE-2: momentos por grupos (el Bridal Shower)', () => {
  it('la invitada del grupo SI lee el momento de su audiencia', async () => {
    await assertSucceeds(getDoc(doc(invitadaConLlave(['bridal']), 'eventos/bodaA/momentos/te')));
  });
  it('un invitado de OTRO grupo NO lo lee', async () => {
    await assertFails(getDoc(doc(invitadaConLlave(['general']), 'eventos/bodaA/momentos/te')));
  });
  it('sin pase NO se lee (ni logueado sin claims de invitado)', async () => {
    await assertFails(getDoc(doc(invitado(), 'eventos/bodaA/momentos/te')));
    await assertFails(getDoc(doc(randomUser(), 'eventos/bodaA/momentos/te')));
  });
  it('la consulta del invitado por sus grupos funciona (list)', async () => {
    const db = invitadaConLlave(['bridal']);
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'eventos/bodaA/momentos'),
          where('visibilidad', '==', 'grupos'),
          where('audiencias', 'array-contains-any', ['bridal']),
        ),
      ),
    );
  });
});

describe('ENLACE-2: RSVP con llave (cupo y doc propio)', () => {
  it('la invitada confirma SU doc, dentro de su cupo', async () => {
    await assertSucceeds(
      setDoc(doc(invitadaConLlave(), 'eventos/bodaA/rsvps/maju'), RSVP_LLAVE_OK),
    );
  });
  it('rechaza pasarse del cupo (admisiones 3 = max 2 acompanantes)', async () => {
    await assertFails(
      setDoc(doc(invitadaConLlave(), 'eventos/bodaA/rsvps/maju'), {
        ...RSVP_LLAVE_OK,
        numAcompanantes: 3,
      }),
    );
  });
  it('rechaza escribir el doc de OTRO invitado', async () => {
    await assertFails(
      setDoc(doc(invitadaConLlave(), 'eventos/bodaA/rsvps/tio'), RSVP_LLAVE_OK),
    );
  });
  it('puede cambiar de opinion (update sin tocar createdAt) y leer su rsvp', async () => {
    const db = invitadaConLlave();
    await assertSucceeds(setDoc(doc(db, 'eventos/bodaA/rsvps/maju'), RSVP_LLAVE_OK));
    await assertSucceeds(getDoc(doc(db, 'eventos/bodaA/rsvps/maju')));
    await assertSucceeds(
      updateDoc(doc(db, 'eventos/bodaA/rsvps/maju'), { asistencia: 'declinado', numAcompanantes: 0 }),
    );
  });
});

describe('ENLACE-2: modo de acceso por llave cierra el RSVP abierto', () => {
  it('con modoAcceso tokenUnico, el RSVP sin llave se rechaza', async () => {
    await env.withSecurityRulesDisabled(async (c) => {
      await updateDoc(doc(c.firestore(), 'publicos/bodaA'), { modoAcceso: 'tokenUnico' });
    });
    await assertFails(setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r9'), RSVP_OK));
  });
  it('con modoAcceso publico (o legado sin campo), el RSVP abierto sigue vivo', async () => {
    await assertSucceeds(setDoc(doc(invitado(), 'eventos/bodaA/rsvps/r10'), RSVP_OK));
  });
});
