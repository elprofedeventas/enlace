// ENLACE - lectura y validacion del Excel de invitados (Pantalla D, ENLACE-3).
// Solo parseo/validacion en memoria: NO toca Firestore (eso vive en services/).
// La escritura la hace services/invitados.crearInvitadosEnLote con estas filas.

import * as XLSX from 'xlsx';

// Fila ya validada, lista para mostrar en la vista previa.
export interface FilaImport {
  fila: number; // numero de fila en el Excel (con encabezado), para ubicar el problema
  nombre: string;
  admisiones: number;
  grupos: string[];
  gruposNuevos: string[]; // grupos de esta fila que aun no existen en la boda
  ok: boolean;
  problemas: string[];
}

export interface ResultadoImport {
  filas: FilaImport[];
  gruposNuevosTotales: string[]; // union de grupos nuevos de todas las filas validas
}

const CABECERAS = { nombre: ['nombre'], admisiones: ['admisiones'], grupos: ['grupos'] };

// Descarga la plantilla .xlsx de 3 columnas con ejemplos.
export function descargarPlantilla(): void {
  const filas = [
    ['Nombre', 'Admisiones', 'Grupos'],
    ['Maria Jose Ordonez', 2, 'Circulo intimo'],
    ['Familia Perez', 4, 'Circulo intimo, Bridal shower'],
    ['Juan Carlos Solano', 1, ''],
  ];
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  hoja['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 36 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Invitados');
  XLSX.writeFile(libro, 'plantilla-invitados-enlace.xlsx');
}

// Devuelve el valor de una columna aceptando variantes de mayusculas/espacios.
function campo(fila: Record<string, unknown>, alias: string[]): unknown {
  for (const clave of Object.keys(fila)) {
    if (alias.includes(clave.trim().toLowerCase())) return fila[clave];
  }
  return undefined;
}

// Lee el .xlsx (primera hoja) como filas por encabezado.
async function leerFilas(file: File): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array' });
  const nombreHoja = libro.SheetNames[0];
  const hoja = nombreHoja ? libro.Sheets[nombreHoja] : undefined;
  if (!hoja) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '' });
}

// Parsea y valida el archivo contra los grupos que ya existen en la boda.
export async function parsearYValidar(
  file: File,
  gruposExistentes: string[],
): Promise<ResultadoImport> {
  const crudas = await leerFilas(file);
  const existentes = new Set(gruposExistentes.map((g) => g.toLowerCase()));
  const nuevos = new Map<string, string>(); // clave en minuscula -> nombre original (dedupe estable)

  const filas: FilaImport[] = crudas.map((cruda, i) => {
    const problemas: string[] = [];

    const nombre = String(campo(cruda, CABECERAS.nombre) ?? '').trim();
    if (nombre.length < 2) problemas.push('Nombre vacio o muy corto');
    else if (nombre.length > 120) problemas.push('Nombre demasiado largo');

    const admBruto = campo(cruda, CABECERAS.admisiones);
    const admNum =
      typeof admBruto === 'number' ? admBruto : parseInt(String(admBruto).trim(), 10);
    let admisiones = 0;
    if (!Number.isInteger(admNum)) problemas.push('Admisiones debe ser un numero entero');
    else if (admNum < 1 || admNum > 21) problemas.push('Admisiones fuera de rango (1 a 21)');
    else admisiones = admNum;

    const gruposBruto = String(campo(cruda, CABECERAS.grupos) ?? '').trim();
    const grupos = gruposBruto
      ? [...new Set(gruposBruto.split(',').map((g) => g.trim()).filter(Boolean))]
      : [];
    const gruposNuevos = grupos.filter((g) => !existentes.has(g.toLowerCase()));

    const ok = problemas.length === 0;
    // Solo contamos grupos nuevos de filas validas: no creamos grupos por una fila con error.
    if (ok) {
      for (const g of gruposNuevos) {
        const clave = g.toLowerCase();
        if (!nuevos.has(clave)) nuevos.set(clave, g);
      }
    }

    return { fila: i + 2, nombre, admisiones, grupos, gruposNuevos, ok, problemas };
  });

  return { filas, gruposNuevosTotales: [...nuevos.values()] };
}
