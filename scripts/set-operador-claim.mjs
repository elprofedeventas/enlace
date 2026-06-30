// ENLACE - siembra el custom claim { operador: true } en la cuenta de Romina.
// En v0 NO usamos api/login (flujo de novios = roadmap #1): el operador se
// habilita una sola vez con este script admin.
//
// Uso (bash, NUNCA pegar el JSON en PowerShell por el BOM):
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json \
//     node scripts/set-operador-claim.mjs operador@correo.com
//
// Requiere: el proveedor Email/Password activado en consola y el usuario creado.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Falta el email. Uso: node scripts/set-operador-claim.mjs <email>');
  process.exit(1);
}

initializeApp({ credential: applicationDefault() });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { operador: true });
// Revoca tokens para forzar el refresco del claim en el proximo login.
await auth.revokeRefreshTokens(user.uid);

console.log(`OK: ${email} (uid ${user.uid}) ahora es operador. Que vuelva a iniciar sesion.`);
