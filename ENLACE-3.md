# ENLACE-3 — El hogar de los novios

> Documento de referencia del corte ENLACE-3. Es el plano que Claude Code lee
> antes de construir. Describe el edificio real que existe tras ENLACE-2, no uno
> idealizado. Todo lo que aquí se pide se apoya en el motor ya construido
> (grupos, llaves, portero, visibilidad por grupos): ENLACE-3 es el **vestido**
> que hace ese motor fácil y agradable para los novios.
>
> Regla de oro: si un requisito de este documento choca con el motor existente,
> se detiene y se pregunta. No se reinventa lo que ya funciona.

---

## 1. Qué es este corte (la habitación habitable)

Hoy, la boda y sus invitados se administran desde el panel del **operador**
(Romina). ENLACE-3 entrega esa administración a los **novios**: entran con su
propia cuenta, ven solo su boda, y la preparan sin tocar nada técnico.

Al terminar ENLACE-3, María José y Juan Carlos pueden, desde su cuenta:

1. **Elegir los hitos** de su boda (pedida, civil, fotos, etc.) de forma
   visual y agradable.
2. **Escoger tema y colores** entre presets (el guardarropa completo llega en
   UX-3; aquí basta con acento + los temas que existan).
3. **Cargar su lista de invitados** de dos formas: importando un Excel o
   agregándolos uno por uno.
4. **Decidir quién ve cada hito** con la pregunta "¿quién puede verlo?" y sus
   tres respuestas (Todos / Solo estos grupos / Solo la pareja).
5. **Compartir las llaves** de sus invitados (link WhatsApp + QR), que ya
   existe desde ENLACE-2.

Lo que NO entra en este corte: fotos de invitados (ENLACE-6), felicitaciones
(ENLACE-5), apertura cinemática (UX-2), guardarropa completo de temas (UX-3).

---

## 2. Los tres niveles de acceso (confirmados)

La analogía es un edificio de departamentos elegante.

| Nivel | Quién | Cómo entra | Qué administra |
|---|---|---|---|
| **Operador** | Romina (propietaria) | Firebase Auth (cuenta propia), claim `operador: true` | Crea bodas y crea la cuenta de los novios. Acceso a todo. |
| **Novios** | María José y Juan Carlos | **Una sola cuenta compartida** (Firebase Auth), su uid en `ownerUids` de su boda | Su boda y solo la suya: hitos, tema, invitados, visibilidad. |
| **Invitados** | Cada persona invitada | Enlace único (llave), sin usuario ni contraseña. Pase firmado por el portero. | Nada. Solo ven lo que su llave abre y confirman su asistencia. |

**Decisión cerrada:** los novios comparten **un usuario y una contraseña**, no
dos. El modelo (`ownerUids` es una lista) soporta varios dueños, pero se crea
una sola cuenta. Menos fricción para ellos, menos complejidad para el sistema.

**Aislamiento estricto (ya garantizado por `firestore.rules`):**
- Un novio solo lee/escribe la boda donde su uid está en `ownerUids`.
- Los campos de control (`ownerUids`, `plan`, `planRenovacion`, `acceso`) están
  **sellados para el novio**: solo el operador los toca. El novio edita el
  contenido de su boda, nunca su plan ni su modo de acceso base.
- Un invitado nunca lee la lista de invitados (ahí viven las llaves); su acceso
  lo resuelve el portero, no una regla que el novio pueda aflojar.

Este reparto ya está implementado y probado en el gate de reglas. ENLACE-3 no
cambia la seguridad: se apoya en ella.

---

## 3. Pantalla A — Elegir los hitos

**Dónde:** la vista de los novios de su boda (evoluciona `MomentosEditor.tsx`,
que hoy es del operador). Objetivo: que elegir hitos sea como armar una lista
de reproducción, no llenar un formulario.

### Experiencia
- Los 9 hitos de plantilla (`momentosPlantilla.ts`) se ofrecen como **tarjetas
  con ícono** que se activan/desactivan con un toque (no chips en una fila
  densa). Cada tarjeta: ícono del tipo, nombre en lenguaje de boda, y un estado
  claro de "incluido / no incluido".
- Un hito incluido se puede **abrir para editar** sus detalles: fecha, hora,
  lugar, descripción, y la pregunta de visibilidad (Pantalla C).
- "+ Momento personalizado" para lo que no está en plantilla.
- **Reordenar** por arrastre (drag-and-drop), no flechas ↑/↓. Es una línea de
  tiempo: se siente natural moverla con el dedo.
- Feedback de guardado automático ("Guardado ✓"), sin botón "Guardar" por hito.

### Bajo el capó (sin cambios de motor)
- Sigue siendo la colección `momentos` con su `orden`, `visibilidad`,
  `audiencias`, `estado`. Solo cambia la piel y el gesto (drag, tarjetas).
- El drag-and-drop reescribe el campo `orden` en batch (máx. 500, ya es regla).

---

## 4. Pantalla B — Tema y colores

**Dónde:** la vista de los novios (evoluciona lo que hoy toca `paleta.acento`).

### Experiencia
- Selección de **acento** entre una paleta de presets (muestras de color
  tocables), más los **temas** que existan al momento (en UX-3 será el
  guardarropa completo: tipografías, ornamentos, texturas; aquí, lo disponible).
- **Vista previa en vivo:** al tocar un color/tema, un mini-preview de la
  invitación se tiñe al instante. El novio ve el resultado antes de confirmar.

### Bajo el capó
- Escribe `paleta.acento` (y, cuando exista, `paleta.ambiente` / `tema`) en el
  doc de gestión Y en la proyección `publicos/{slug}`, atómico (`writeBatch`),
  igual que `setModoAcceso` ya hace. El sistema de variables `--boda-*` de UX-1
  ya consume esto: cero trabajo de re-tematizado.

---

## 5. Pantalla C — ¿Quién ve cada hito? (el corazón de la simplicidad)

Diseño ya aprobado. La analogía: cada hito es una **habitación con una puerta**,
y los novios solo responden *"¿quién puede entrar aquí?"*.

### Experiencia (tres respuestas, radio, un toque)
1. **Todos mis invitados** → el hito lo ve cualquiera con llave de esta boda.
2. **Solo estos grupos** → aparecen las pastillas de los grupos de la boda para
   marcar cuáles (Bridal shower, Círculo íntimo…).
3. **Solo la pareja (privado)** → nadie más que los novios.

Nunca aparecen las palabras "visibilidad", "audiencias" ni "token". Es lenguaje
de boda, no de base de datos.

### Traducción al motor (exacta, sin inventar)
| Respuesta en pantalla | Se guarda como |
|---|---|
| Todos mis invitados | `visibilidad: 'publico'` |
| Solo estos grupos | `visibilidad: 'grupos'` + `audiencias: [grupos marcados]` |
| Solo la pareja (privado) | `visibilidad: 'privado'` |

Esto es EXACTAMENTE el modelo que `firestore.rules` y `momentos.ts` ya
implementan y que el gate ya prueba. Pantalla C es solo su cara amable.

### Los grupos de invitados (las "listas de contactos")
- Se administran como pastillas con contador (ver diseño aprobado): crear,
  renombrar, borrar. Viven en `evento.grupos` (ya existe, ya validado en reglas:
  lista de máx. 30).
- Un grupo borrado debe limpiarse de los invitados que lo tenían y de las
  `audiencias` de los momentos que lo usaban (operación de barrido en batch).
  **Preguntar antes de construir el barrido** si hay duda de alcance.

### Nota de producto (decisión de Alfredo, cerrada)
NO se incluye por ahora una cuarta opción "cualquiera con el link" (apertura
total sin ser invitado). Tres opciones se entienden de un vistazo; cuatro hacen
dudar. Se añadirá solo si se pide.

---

## 6. Pantalla D — Los invitados (la que evita el doble trabajo)

El dolor real: una boda de 200 personas. Los novios ya tienen esa lista en una
libreta o un Excel. Volver a teclear 200 nombres en el celular es el "doble
trabajo" que hace abandonar la app. Principio de Alfredo aplicado: **no hacer a
mano lo que una máquina puede hacer.**

### Dos caminos (decisión cerrada: ambos)

**Camino 1 — Importar Excel (el que hace magia).**
- Un botón "Importar desde Excel" con una **plantilla descargable** de 3
  columnas, ni una más:

  | Columna | Obligatoria | Qué es |
  |---|---|---|
  | **Nombre** | Sí | Nombre del invitado (o de la familia/pareja). |
  | **Admisiones** | Sí | Cuántas personas cubre esa invitación (ella incluida). Entero 1–21. |
  | **Grupos** | No | Grupos a los que accede, **separados por coma** (ej. "Bridal shower, Círculo íntimo"). Vacío = solo "Todos". |

- Flujo: subir `.xlsx` → **vista previa** con validación (filas OK / filas con
  problema marcadas) → confirmar → se crean los invitados con su llave de una
  sola vez, en `batch` (máx. 500 por lote; 200 entra en uno).
- Grupos nuevos que aparezcan en el Excel y no existan aún: ofrecer crearlos
  automáticamente (o marcarlos para revisión). **Preguntar** cuál de las dos.
- Cada fila crea un doc en `eventos/{slug}/invitados` con `token` generado
  (`generarLlave()` ya existe), `estado: 'activo'`, `createdAt`.

**Camino 2 — Agregar uno por uno (el remate fino).**
- El alta manual que ya existe en `InvitadosPanel.tsx` (nombre, admisiones,
  grupos), para sumar al invitado que llegó tarde sin abrir Excel.

### Librería
- Import/export de `.xlsx`: usar **SheetJS (`xlsx`)**, el mismo estándar del
  Protocolo Nueva Órbita (§18). Es dependencia nueva en este repo Clase A →
  **pedir confirmación antes de instalar** (regla dura del stack).

### Bajo el capó
- La colección `invitados`, las reglas y el portero NO cambian. Import y alta
  manual escriben el mismo tipo de documento. La generación de llave, la
  entrega por WhatsApp/QR y la revocación ya existen desde ENLACE-2.

---

## 7. Qué construir vs. qué ya existe (para no reinventar)

| Pieza | Estado |
|---|---|
| Colección `invitados` + llave + estados | ✅ Existe (ENLACE-2) |
| Portero serverless + pase firmado | ✅ Existe (ENLACE-2) |
| `firestore.rules` con aislamiento y visibilidad por grupos | ✅ Existe y probado |
| Entrega de llave (link WhatsApp + QR) + revocar/regenerar | ✅ Existe (ENLACE-2) |
| Momentos con `visibilidad` público/privado/grupos | ✅ Existe (ENLACE-2) |
| Cuenta de novios + `ownerUids` + campos sellados | ✅ Existe en reglas |
| **Vista de novios (no operador) de su boda** | 🔨 Construir |
| **Selección de hitos como tarjetas + drag-and-drop** | 🔨 Construir |
| **Selector de tema/color con preview en vivo** | 🔨 Construir |
| **Pantalla C "¿quién puede verlo?" (cara amable)** | 🔨 Construir |
| **Import Excel con plantilla de 3 columnas + preview** | 🔨 Construir (pedir instalar `xlsx`) |
| **Barrido al borrar un grupo** | 🔨 Construir (confirmar alcance) |

---

## 8. Reglas para Claude Code en este corte

- No cambiar `firestore.rules`, el portero, ni los servicios de seguridad salvo
  necesidad justificada. Si un requisito parece exigirlo, **detenerse y
  preguntar** (frase de freno).
- No instalar `xlsx` (ni ninguna librería) sin confirmación explícita.
- Toda escritura sigue pasando por la capa `services/`.
- Drag-and-drop y barridos → escritura en `batch` (máx. 500).
- Cerrar listeners de Firestore en el cleanup de `useEffect`.
- Español neutro en UI, sin emojis, sin regionalismos, con tildes.
- Al final de cada sesión, listar los archivos modificados, uno por línea.
- Cada pantalla es una habitación habitable: se entrega funcionando antes de
  pasar a la siguiente. Orden sugerido de sub-cortes:
  **D (invitados+Excel) → C (visibilidad) → A (hitos) → B (tema).**
  Razón: los invitados y los grupos son el cimiento; hitos y tema visten encima.

---

## 9. Definición de "listo" del corte

- Un novio entra con su cuenta, ve **solo su boda**.
- Importa un Excel de prueba de ~30 invitados y los ve creados con su llave.
- Agrega uno manual.
- Crea 2 grupos, asigna invitados, marca un hito como "solo estos grupos".
- Elige un acento y ve el preview teñido.
- `pnpm build`, `pnpm lint` y `pnpm test:rules` verdes (los 47 siguen verdes;
  si el corte añade reglas, sus tests nuevos también).
- Nada de deploy sin autorización de Alfredo.
