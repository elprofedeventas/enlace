# ENLACE — guia del repo (Clase A)

Experiencia digital de boda **multi-tenant** de Nueva Orbita. Operada por Romina
Ordonez ("Inspiracion"). 1 app, N bodas. Dominio: `enlace.nuevaorbita.com`.

## Stack (Clase A)

React 19 + Vite · **TypeScript + Tailwind** · pnpm · Firebase (Firestore +
Auth + App Check) · Vercel. Estilo: Prettier (con `;`, comillas simples) + ESLint.
`pnpm build` = `tsc -b && vite build`. Build verde = `lint` + `test:rules` + `build`.

## Arquitectura (lo que NO se negocia)

- **El tenant es el EVENTO, no el uid.** `id == slug`. Tres documentos por boda:
  - `eventos/{id}` — gestion PRIVADA (ownerUids, plan, planRenovacion).
  - `publicos/{id}` — proyeccion PUBLICA de la invitacion (`get`-only, sin `list`).
  - `eventos/{id}/rsvps/{id}` — RSVP del invitado (escritura PUBLICA validada).
- **La seguridad la dan `firestore.rules` + custom claims `{ operador, eventos[] }`**,
  NUNCA el cliente. Firebase solo se toca desde `src/services/`.
- **El invitado NO es identidad:** escribe su RSVP sin login, admitido solo bajo
  App Check (enforce en consola) + validacion estricta de forma en reglas.
- **Split publico/privado:** jamas exponer el doc de gestion al invitado (fugaria
  `ownerUids`). El landing lee solo `publicos/{id}`.

## v0 = walking skeleton (lo unico construido)

operador login → crea boda (publicada) → invitacion en `/b/:slug` → invitado
confirma RSVP → operador lo ve en tiempo real. **Claim `operador` se siembra con
`scripts/set-operador-claim.mjs`** (api/login para novios = roadmap #1).

## Cubo rojo (NO construir aun)

Fotos (sera **Cloudinary FIRMADO**, no Storage; fase 2), pagos, IA, subdominio por
boda, panel de novios editable, RSVP enriquecido (menu/alergias). Alergias = dato
de salud: cuando entre, modelar como "restriccion de menu" (minimizacion).

## LOPDP

Responsable del tratamiento = Nueva Orbita. El RSVP capta PII de terceros: checkbox
de consentimiento NO premarcado (obligatorio) + version guardada en el doc. Pagina
`/privacidad` publica.
