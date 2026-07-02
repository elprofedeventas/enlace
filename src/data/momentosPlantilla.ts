// ENLACE - plantilla sugerida de momentos de la boda. La pareja/operador la usa
// como punto de partida: activa los que apliquen, los edita y puede anadir otros.
// El `orden` deja el flujo natural antes -> el dia -> despues.

import type { FaseMomento, Visibilidad } from '../types';

export interface MomentoPlantilla {
  tipo: string;
  titulo: string;
  fase: FaseMomento;
  orden: number;
  // Visibilidad por defecto. Los momentos intimos (bridal shower, despedida,
  // luna de miel) nacen PRIVADOS; la segmentacion fina por invitado llega en el
  // Corte 3 (invite-only).
  visibilidadDefecto: Visibilidad;
  descripcion?: string;
}

export const FASES: { fase: FaseMomento; etiqueta: string }[] = [
  { fase: 'antes', etiqueta: 'Antes' },
  { fase: 'dia', etiqueta: 'El dia' },
  { fase: 'despues', etiqueta: 'Despues' },
];

export const MOMENTOS_PLANTILLA: MomentoPlantilla[] = [
  { tipo: 'pedida-mano', titulo: 'Pedida de mano', fase: 'antes', orden: 10, visibilidadDefecto: 'publico' },
  { tipo: 'bendicion-aros', titulo: 'La bendicion de los aros', fase: 'antes', orden: 20, visibilidadDefecto: 'publico' },
  { tipo: 'bridal-shower', titulo: 'Bridal Shower', fase: 'antes', orden: 30, visibilidadDefecto: 'privado', descripcion: 'Una tarde de te para mujeres.' },
  { tipo: 'despedida-soltera', titulo: 'Despedida de soltera', fase: 'antes', orden: 40, visibilidadDefecto: 'privado' },
  { tipo: 'sesion-fotos', titulo: 'La sesion de fotos', fase: 'antes', orden: 50, visibilidadDefecto: 'publico' },
  { tipo: 'civil', titulo: 'Matrimonio Civil', fase: 'dia', orden: 60, visibilidadDefecto: 'publico' },
  { tipo: 'eclesiastico', titulo: 'Matrimonio Eclesiastico', fase: 'dia', orden: 70, visibilidadDefecto: 'publico' },
  { tipo: 'luna-miel', titulo: 'Luna de miel', fase: 'despues', orden: 80, visibilidadDefecto: 'privado' },
  { tipo: 'invitaciones', titulo: 'Documentacion de las invitaciones', fase: 'despues', orden: 90, visibilidadDefecto: 'publico', descripcion: 'Como fueron nuestras invitaciones.' },
];
