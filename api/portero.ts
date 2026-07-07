// ENLACE - el PORTERO (Vercel serverless, ENLACE-2). Recibe { slug, llave },
// verifica la llave contra la lista privada de invitados con el SDK de
// administrador (las reglas no aplican aqui: el portero es de confianza) y,
// si abre, firma un PASE (custom token de Firebase) con los claims del
// invitado: quien es, cuantas admisiones tiene y que grupos integra. Las
// reglas de Firestore luego hacen cumplir ese pase puerta por puerta.
//
// Config en Vercel (Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT = JSON completo de la cuenta de servicio
//   (Consola Firebase > Configuracion > Cuentas de servicio > Generar clave).
//
// Mismo patron que TALLER (facturar.js): secreto en Vercel, nunca en el cliente.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface PorteroRequest {
  method?: string;
  body?: unknown;
}
interface PorteroResponse {
  status: (code: number) => PorteroResponse;
  json: (data: unknown) => void;
}

function adminApp(): App {
  const existente = getApps()[0];
  if (existente) return existente;
  const cuenta = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}');
  return initializeApp({ credential: cert(cuenta) });
}

const LLAVE_RE = /^[A-Za-z0-9]{20,64}$/;
const SLUG_RE = /^[a-z0-9-]{3,40}$/;

export default async function handler(req: PorteroRequest, res: PorteroResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'metodo_no_permitido' });
    return;
  }

  const { slug, llave } = (req.body ?? {}) as { slug?: string; llave?: string };
  if (!slug || !llave || !SLUG_RE.test(slug) || !LLAVE_RE.test(llave)) {
    res.status(400).json({ error: 'solicitud_invalida' });
    return;
  }

  try {
    const app = adminApp();
    const db = getFirestore(app);

    // La boda debe existir y estar publicada.
    const evento = await db.doc(`eventos/${slug}`).get();
    if (!evento.exists || evento.get('estado') !== 'publicado') {
      res.status(401).json({ error: 'llave_invalida' });
      return;
    }

    // Buscar la llave en la lista privada. Solo llaves activas abren.
    const snap = await db
      .collection(`eventos/${slug}/invitados`)
      .where('token', '==', llave)
      .where('estado', '==', 'activo')
      .limit(1)
      .get();

    const invitado = snap.docs[0];
    if (!invitado) {
      res.status(401).json({ error: 'llave_invalida' });
      return;
    }

    const nombre: string = invitado.get('nombre') ?? '';
    const admisiones: number = invitado.get('admisiones') ?? 1;
    const grupos: string[] = invitado.get('grupos') ?? [];

    // El pase firmado: uid estable por invitado + claims que leen las reglas.
    const uid = `inv-${slug}-${invitado.id}`.slice(0, 128);
    const token = await getAuth(app).createCustomToken(uid, {
      invitado: true,
      eventoId: slug,
      invitadoId: invitado.id,
      nombre,
      admisiones,
      grupos,
    });

    res.status(200).json({ token, nombre, admisiones, grupos });
  } catch {
    res.status(500).json({ error: 'portero_no_disponible' });
  }
}
