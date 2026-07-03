# ENLACE — Inventario y handoff para pulido de experiencia (UX)

> Documento autocontenido para que otra sesión de Claude (o un diseñador) entienda
> ENLACE de cero y **perfeccione la experiencia** sin romper la arquitectura ni la
> seguridad. Léelo entero antes de tocar nada. Fecha del inventario: 2026-07-03.

---

## 0. TL;DR — qué es y qué se te pide

ENLACE es una **experiencia digital de boda multi-tenant** (1 app, N bodas), operada
por Romina Ordóñez ("Inspiración") y vendida a parejas. La invitación digital es solo
**una pantalla** de un producto que acompaña la boda **antes, el día y después**.

Está **EN VIVO** en https://enlace.nuevaorbita.com con lo esencial funcionando
(crear boda → invitación pública → RSVP → panel en tiempo real) + una **línea de
tiempo de "momentos"**. **Funciona pero es visualmente sobrio/plano.** El encargo:
**hacerlo más agradable, cálido y elegante** — sobre todo la **invitación pública**
(la ve cada invitado) y el editor de momentos. Ver §9 (oportunidades priorizadas).

**Regla de oro para quien pula:** puedes cambiar libremente estilos, layout, microcopy,
animaciones y componentes de presentación. **NO** cambies el modelo de datos, las
reglas de Firestore, la capa `services/`, ni la lógica de seguridad sin entender §7.

---

## 1. Contexto de producto (decisiones ya tomadas)

- **Clase A** del estándar Nueva Órbita: React 19 + Vite + **TypeScript + Tailwind** +
  Firebase (Firestore + Auth) + Vercel. Mobile-first, PWA (la PWA en sí está diferida).
- **3 roles:** Operador (Romina, único en v0), Novios (roadmap), Invitados (sin cuenta,
  entran por el slug público).
- **Dominio:** `enlace.nuevaorbita.com` (producto Nueva Órbita; footer "Inspiración by
  Romina Ordóñez"). No es white-label.
- **Acceso del invitado (v0):** slug público + nombre (sin login, sin lista). El invitado
  abre `/b/[slug]`, se identifica escribiendo su nombre y confirma. La segmentación
  "solo mujeres ven el Bridal Shower" es **invite-only**, aún NO construida (Corte 3).
- **Fotos:** irán por **Cloudinary firmado** (el proyecto vive en Spark, sin tarjeta;
  Firebase Storage exige Blaze). Aún NO construido (Corte 2).
- **El "después"/recuerdo:** servicio recurrente (campo `planRenovacion` ya modelado).
- **LOPDP:** la app capta datos de terceros (invitados) → consentimiento no premarcado
  + página `/privacidad`. Responsable del tratamiento = Nueva Órbita.

---

## 2. Estado actual — qué está EN VIVO

| Recurso | Valor |
|---|---|
| Web (producción) | https://enlace.nuevaorbita.com |
| Proyecto Firebase | `enlace-nuevaorbita` (nº 149887588286), plan **Spark** (sin tarjeta) |
| Proyecto Vercel | `elprofedeventas-projects/enlace` |
| Carpeta local | `C:\Archivos\Trabajo\Nueva Orbita\apps\enlace` |
| Operador | `elprofedeventas@gmail.com` (claim `operador:true`) |
| Auth | Email/Password activo |

Construido y verificado: **walking skeleton** (login → crear boda → invitación → RSVP →
panel en tiempo real) + **Corte 1: momentos** (línea de tiempo editable, público/privado).
34 tests de reglas verdes. Flujos verificados contra Firebase real.

**Abierto (no bloquea el pulido de UX):**
- **App Check** está sin inicializar (la clave reCAPTCHA Enterprise no sirve en Spark;
  falta crear una clave reCAPTCHA **v3**). La seguridad la dan las reglas mientras tanto.
- **Invite-only** (Corte 3) y **fotos/Cloudinary** (Corte 2) pendientes.

---

## 3. Stack y estructura del proyecto

```
apps/enlace/
  src/
    firebase.ts            # init Firebase (App Check + persistentLocalCache). Único que toca firebase/*
    config.ts              # APP_NOMBRE='ENLACE', OPERADORA, MAX_ACOMPANANTES
    main.tsx / App.tsx      # arranque + AuthProvider + AppRouter
    index.css              # tokens de tema (variables CSS) + base
    types/index.ts         # modelo de dominio (Evento, EventoPublico, Rsvp, Momento...)
    data/
      consentimiento.ts    # texto LOPDP + versión
      momentosPlantilla.ts # los 9 momentos sugeridos + fases
    contexts/AuthContext.tsx   # user + claims + loading
    routes/AppRouter.tsx, ProtectedRoute.tsx
    services/              # ÚNICA capa que habla con Firestore
      auth.ts, eventos.ts, rsvps.ts, momentos.ts
    components/
      Layout.tsx           # shell: topbar + bottom nav
      ui.tsx               # Spinner, EstadoCarga/Vacio/Error, Card, Boton, Campo
      CampoPass.tsx, ThemeToggle.tsx, PoliticaPrivacidad.tsx
    hooks/useTema.ts       # tema claro/oscuro
    pages/
      Login.tsx, Panel.tsx, EventoEditor.tsx, EventoDetalle.tsx,
      MomentosEditor.tsx, Invitacion.tsx, Cuenta.tsx, SinAcceso.tsx
  firestore.rules, firestore.indexes.json, vercel.json, tailwind.config.js
```

Comandos: `pnpm dev` (local), `pnpm build` (= `tsc -b && vite build`), `pnpm lint`,
`pnpm test:rules` (necesita Java + emulador Firestore).

---

## 4. Sistema visual ACTUAL (lo que hay que elevar)

- **Fuentes (ya cargadas en `index.html`):** `Inter` (sans, cuerpo) + `Cormorant
  Garamond` (serif, para nombres de la pareja y títulos grandes). En Tailwind:
  `font-sans` e `font-serif`.
- **Tema:** oscuro por defecto, con toggle a claro (persistido en `localStorage`,
  aplicado antes del render). Se controla con `data-theme="oscuro|claro"` en `<html>`.
- **Tokens de color (CSS vars en `src/index.css`)** — la UI usa estas variables y
  utilidades Tailwind `enlace-*`:
  - Oscuro: `--enlace-bg #160f17`, `--enlace-surface #221624`, `--enlace-surface-2
    #2e1f31`, `--enlace-border #3d2b41`, `--enlace-text #f6eaf2`, `--enlace-text-soft
    #c2a8c0`, `--enlace-primary #f13063`.
  - Claro: `--enlace-bg #fdf7fa`, surface `#fff`, texto `#2a1722`, primary `#bb0c43`.
  - Escala de marca `enlace-50..950` (rosa/granate) en `tailwind.config.js`.
- **Acento por boda:** cada evento tiene `paleta.acento` (hex). Hoy solo se usa en la
  invitación (eyebrow "Nos casamos", botones del RSVP, checks). **Oportunidad:** temar
  toda la invitación con ese acento.
- **Estética actual:** limpia y correcta, pero **plana**: poca jerarquía visual, sin
  imágenes/decoración, sin animación, mucha caja rectangular. Se siente "app de
  gestión", no "invitación de boda emotiva".

---

## 5. Inventario de pantallas (rutas)

Shell (`Layout.tsx`, solo en el panel protegido): topbar con "ENLACE" a la izquierda y
"Mi cuenta" arriba a la derecha; bottom nav con **Bodas** / botón central **+** (nueva
boda) / **Mi cuenta**. La invitación pública y el login NO usan este shell.

### Panel del operador (requiere login)
1. **`/login`** (`Login.tsx`) — centrado; "ENLACE" en serif grande + tagline; campo
   correo + contraseña (con ver/ocultar); botón "Entrar"; "Olvidé mi contraseña".
   *Plano; primera impresión mejorable.*
2. **`/` Panel** (`Panel.tsx`) — título "Bodas"; lista de tarjetas (nombres en serif,
   `fecha · lugar`, `/b/slug · estado`); estado vacío; FAB "+" para crear. *Sin iconos,
   sin resumen, sin búsqueda.*
3. **`/eventos/nuevo`** (`EventoEditor.tsx`) — formulario "Nueva boda": Nombre 1 / Nombre
   2, slug (autogenerado desde los nombres, editable, con preview `/b/…`), fecha, lugar,
   dirección, mensaje (textarea), acompañantes permitidos; botón "Crear y publicar".
   *Formulario largo de una sola columna; se podría hacer más guiado/amable.*
4. **`/eventos/:slug`** (`EventoDetalle.tsx`) — nombres; link "Ver invitación pública";
   tarjeta "Momentos de la boda →"; 3 tarjetas de métrica (Confirman / Personas / No
   asisten); lista "Confirmaciones" **en tiempo real** (nombre, "Asiste +N" / "No
   asiste", mensaje). *Funcional; las métricas y la lista pueden verse mucho mejor.*
5. **`/eventos/:slug/momentos`** (`MomentosEditor.tsx`) — gestor de la línea de tiempo:
   chips para añadir de la plantilla (los 9), "+ Momento personalizado", y una lista de
   tarjetas por momento con: título editable inline, ↑/↓ para ordenar, selector de fase,
   fecha, hora, lugar, descripción, toggles **Público/Privado** y **Planeado/Realizado**,
   Eliminar y Guardar. *Tarjeta densa; reordenar con flechas; sin iconos por tipo; sin
   previsualización de cómo se verá.*
6. **`/cuenta`** (`Cuenta.tsx`) — "Mi cuenta": toggle de tema, tarjeta "Mis datos"
   (correo, rol), "Cerrar sesión", link a Política de Privacidad. *Mínima (falta cambiar
   contraseña/correo — diferido).*
7. **`/sin-acceso`** (`SinAcceso.tsx`) — para una sesión sin permiso.

### Público (sin login)
8. **`/b/:slug` — LA INVITACIÓN** (`Invitacion.tsx`) — **la pantalla estrella.** Orden
   actual: (portada si hay imagen) → eyebrow "Nos casamos" → nombres en serif grande →
   `fecha · lugar` → dirección → mensaje → **"Nuestros momentos"** (línea de tiempo de
   los momentos **públicos**, agrupada por Antes / El día / Después) → **formulario RSVP**
   (nombre; botones "Sí, asistiré" / "No podré ir"; acompañantes; mensaje opcional;
   checkbox de consentimiento con link a privacidad; botón "Confirmar") → al enviar,
   estado "Gracias" → footer "Hecho con ENLACE · Inspiración by Romina Ordóñez".
   *Es lo más importante y lo más plano. Aquí está el 80% del valor del pulido.*
9. **`/privacidad`** (`PoliticaPrivacidad.tsx`) — texto LOPDP por secciones.

---

## 6. Componentes reutilizables (en `components/ui.tsx` salvo nota)

- `Spinner`, `EstadoCarga`, `EstadoVacio`, `EstadoError` — los 3 estados obligatorios
  del DoD (cargando/vacío/error). *Genéricos; se pueden branded-izar.*
- `Card` — contenedor con borde + surface.
- `Boton` — botón primario (rosa). *No se usa de forma consistente: varios botones están
  estilados inline; unificar es una mejora de UX/mantenimiento.*
- `Campo` — input con label.
- `CampoPass` — contraseña con ver/ocultar (estándar Nueva Órbita).
- `ThemeToggle` — claro/oscuro con icono + texto.

---

## 7. Restricciones que NO se deben romper (lee antes de tocar)

1. **La seguridad la dan `firestore.rules` + claims, no el cliente.** No muevas lógica de
   permisos al front. El invitado escribe su RSVP sin login: las reglas validan forma,
   caps y consentimiento. No cambies los campos que se escriben sin ajustar las reglas
   (usan `hasOnly`, listas blancas exactas).
2. **Firebase solo se toca desde `src/services/`.** Las páginas no importan `firebase/*`.
3. **Split público/privado:** el invitado lee `publicos/{slug}` (proyección pública) y
   los momentos con `visibilidad == 'publico'`. Nunca expongas el doc de gestión
   `eventos/{id}` (tiene `ownerUids`, `plan`…). No añadas campos sensibles a lo público.
4. **Estilos = Tailwind + tokens CSS (`--enlace-*`).** No metas CSS Modules ni otra
   librería de estilos (rompe la coherencia de Clase A). Puedes añadir animaciones con
   Tailwind/CSS; si quieres una lib de animación, propónlo antes.
5. **Mobile-first.** El invitado abre la invitación en el móvil. Área táctil ≥44px.
6. **Tema claro y oscuro deben verse bien ambos** (es parte del DoD). Cuida contraste.
7. **DoD por cambio:** `pnpm build` verde + lint + (si tocas reglas) `pnpm test:rules` +
   revisar los 3 estados de UI. No romper los flujos existentes.
8. **Spark:** sin fotos aún (Cloudinary llega en Corte 2). No asumas Firebase Storage.
9. **Acentos en español:** el código actual evita tildes por costumbre; con UTF-8 son
   seguros. Mejorar el microcopy CON tildes correctas es bienvenido.

---

## 8. Modelo de datos (referencia rápida)

- `eventos/{eventoId}` (privado, id == slug): novios{personaA,personaB}, fecha, lugar,
  mensajeInvitacion, portadaUrl?, paleta{acento}, ownerUids[], plan, planRenovacion,
  acceso{modo}, maxAcompanantesDefault, estado(borrador|publicado|post_evento|archivado).
- `publicos/{eventoId}` (público, get-only): proyección segura de la invitación.
- `eventos/{id}/rsvps/{id}`: nombre, asistencia(confirmado|declinado), numAcompanantes,
  mensaje?, aceptoPolitica, politicaVersion, createdAt. Inmutable.
- `eventos/{id}/momentos/{id}`: titulo, tipo, fase(antes|dia|despues), fecha?, hora?,
  lugar?, descripcion?, orden, visibilidad(publico|privado), estado(planeado|realizado).

Los 9 momentos plantilla (`data/momentosPlantilla.ts`): Pedida de mano, Bendición de los
aros, Bridal Shower (privado), Despedida de soltera (privado), Sesión de fotos, Matrimonio
Civil, Matrimonio Eclesiástico, Luna de miel (privado), Documentación de las invitaciones.

---

## 9. OPORTUNIDADES DE PULIDO — priorizadas (el encargo)

### A. La invitación `/b/:slug` — máxima prioridad (la ve cada invitado)
1. **Portada / hero emotivo:** cuando haya `portadaUrl`, tratarla como hero a pantalla
   con overlay y nombres encima; cuando no, un fondo decorativo con el `paleta.acento` +
   un monograma con las iniciales de la pareja.
2. **Jerarquía y ritmo:** escala tipográfica más ambiciosa (nombres muy grandes en serif,
   con "&" ornamental), separadores decorativos, más aire, secciones con entrada suave
   (fade/slide al hacer scroll).
3. **Temar con `paleta.acento`:** que el acento de la pareja tiña toda la invitación
   (títulos, líneas, botones, timeline), no solo detalles sueltos.
4. **Cuenta regresiva** a la fecha + **"Añadir al calendario"** (.ics) + **link a mapa**
   si hay dirección/mapsUrl.
5. **Timeline "Nuestros momentos" visual:** convertirla en una línea de tiempo vertical
   real con nodos/iconos por tipo de momento y por fase; hoy es una lista con borde
   izquierdo. Iconos por tipo (anillo, cámara, iglesia, avión…).
6. **RSVP más humano:** stepper +/- para acompañantes (en vez de input numérico); toggle
   asistencia más claro y bonito; validación inline; estado "Gracias" celebratorio
   (animación/confeti sutil, mensaje cálido, quizá "añade la fecha a tu calendario").
7. **Footer viral** más discreto y elegante.
8. Estados: "invitación no disponible / no encontrada" con marca (no el genérico actual).

### B. Editor de momentos `/eventos/:slug/momentos`
9. Agrupar visualmente por fase (Antes / El día / Después) con encabezados.
10. Icono por tipo de momento; chips de plantilla más visuales.
11. Reordenar con **drag-and-drop** (hoy flechas ↑/↓).
12. **Previsualización**: un botón "ver cómo lo verá el invitado".
13. Autosave o feedback de guardado más claro; la tarjeta hoy es densa en móvil.

### C. Panel / operador
14. Iconografía y tarjetas más ricas en el listado de bodas; resumen (nº confirmados) en
    cada tarjeta; búsqueda/orden cuando haya muchas.
15. `EventoDetalle`: las 3 métricas como tarjetas con más carácter; lista de
    confirmaciones con avatares/iniciales, filtros (asisten/no), y un vacío más cálido.
16. `EventoEditor`: formulario más guiado (agrupar en pasos o secciones), preview en vivo
    de la invitación mientras se llena.
17. `Login`: primera impresión con marca (fondo, monograma, calidez).

### D. Transversal
18. **Skeleton loaders** en vez de spinner en listas.
19. **Microcopy** cálido y con tildes correctas en toda la app.
20. **Unificar botones/inputs** en los componentes de `ui.tsx` (hoy hay estilos inline
    repetidos); definir variantes (primario/secundario/fantasma).
21. **Accesibilidad:** foco visible, `aria-*`, contraste en tema claro, tamaños táctiles.
22. **Iconografía** consistente (hoy se usan glifos unicode sueltos: ◈, ●, +). Considerar
    un set de iconos SVG ligero.
23. **Favicon/branding**: hay un `favicon.svg` simple (corazón); falta identidad más fina.
24. Revisar ambos temas (claro/oscuro) en cada pantalla tras los cambios.

---

## 10. Cómo trabajar (para quien pula)

- Corre local con `pnpm dev` y un `.env` con la config de Firebase (pídela; las
  `VITE_FIREBASE_*` son públicas). Para ver la invitación con datos, crea una boda desde
  el panel y añade momentos, o pide que se siembre una boda demo.
- Cambios seguros: páginas en `src/pages/`, componentes en `src/components/`, tokens en
  `src/index.css`, escala/config en `tailwind.config.js`. Añade componentes de
  presentación nuevos sin tocar `services/` ni `firestore.rules`.
- Antes de dar por hecho un cambio: `pnpm build` + `pnpm lint` verdes; revisar en móvil y
  en ambos temas; no romper el flujo RSVP ni el panel en tiempo real.
- No despliegues a producción sin confirmarlo con el dueño (Vercel: `vercel --prod`).

---

## 11. Roadmap (contexto, no parte de este encargo)

Corte 2: **fotos por momento** (Cloudinary firmado). Corte 3: **invite-only** (lista de
invitados + link/QR único + audiencia por momento; segmentación real "solo mujeres").
Luego: panel de novios, libro de firmas, música, seating/QR, modo "después"/recuerdo.
App Check pendiente de clave reCAPTCHA v3. **Nada de esto bloquea el pulido de UX.**
