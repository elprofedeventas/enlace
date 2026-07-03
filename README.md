# ENLACE

Experiencia digital de boda **multi-tenant** (1 app, N bodas) de Nueva Órbita.
Operada por Romina Ordóñez ("Inspiración"): cada pareja tiene su espacio con
invitación digital, confirmaciones (RSVP) en tiempo real y una línea de tiempo de
los momentos de la boda — antes, el día y después.

**En vivo:** https://enlace.nuevaorbita.com

## Stack

React 19 + Vite · **TypeScript + Tailwind** · pnpm · Firebase (Firestore + Auth +
App Check) · Vercel. App de **Clase A** del estándar Nueva Órbita.

## Desarrollo

```bash
pnpm install
pnpm dev          # local (necesita un .env con la config de Firebase)
pnpm build        # tsc -b && vite build
pnpm lint
pnpm test:rules   # tests de reglas Firestore (requiere Java + emulador)
```

Copia `.env.example` a `.env` y rellena las variables `VITE_FIREBASE_*` (son
públicas; la seguridad la dan las reglas de Firestore + App Check, no esconderlas).

## Arquitectura (lo esencial)

- **El tenant es el EVENTO**, no el usuario. `id == slug`. Tres documentos por boda:
  `eventos/{id}` (gestión privada), `publicos/{id}` (proyección pública de la
  invitación) y las subcolecciones `rsvps` y `momentos`.
- **La seguridad la dan `firestore.rules` + custom claims**, nunca el cliente.
- Firebase solo se toca desde `src/services/`.

## Documentación

- `docs/HANDOFF-UX.md` — inventario completo + oportunidades de pulido de experiencia.
- `CLAUDE.md` — guía corta del repo para agentes.

---

Hecho con [Claude Code](https://claude.com/claude-code).
