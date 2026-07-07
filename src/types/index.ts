// ENLACE - modelo de dominio (Clase A). Espanol en los nombres de dominio.
// El TENANT es el EVENTO. id == slug. Ver memoria enlace-project.

export type EstadoEvento = 'borrador' | 'publicado' | 'post_evento' | 'archivado';
// 'publico' = slug + nombre (modelo v1, decision de producto). 'codigo'/'tokenUnico'
// (invite-only / QR) son fases posteriores.
export type ModoAcceso = 'publico' | 'codigo' | 'tokenUnico';
export type Plan = 'esencial' | 'premium' | 'lujo';
export type Asistencia = 'confirmado' | 'declinado';

// Custom claims (token). El operador tiene acceso global; los novios llevan la
// lista de sus eventos. Se siembran SOLO server-side (script admin / api futura).
export interface Claims {
  operador: boolean;
  eventos: string[];
}

export interface Novios {
  personaA: string;
  personaB: string;
}

export interface Lugar {
  nombre: string;
  direccion?: string;
  mapsUrl?: string;
}

export interface Paleta {
  acento: string;
}

// ---- Invitados: la lista con llave unica (ENLACE-2) ----
export type EstadoInvitado = 'activo' | 'revocado';

// Invitado con llave: eventos/{eventoId}/invitados/{invitadoId}. PRIVADO
// (solo operador/owners lo leen); el invitado entra por el portero, nunca
// lee este doc. `admisiones` = personas totales que cubre su invitacion
// (incluido el/ella): admisiones 3 = invitado + 2 acompanantes.
export interface Invitado {
  invitadoId: string;
  eventoId: string;
  nombre: string;
  admisiones: number;
  grupos: string[];
  token: string; // la llave. Vive SOLO en este doc privado.
  estado: EstadoInvitado;
  createdAt: Date | null;
}

export type InvitadoInput = Omit<Invitado, 'invitadoId' | 'createdAt'>;

// Sesion del invitado tras canjear su llave en el portero (claims del pase).
export interface SesionInvitado {
  eventoId: string;
  invitadoId: string;
  nombre: string;
  admisiones: number;
  grupos: string[];
}

export interface PlanRenovacion {
  recurrente: boolean;
  vence?: string; // ISO date
  estado?: 'activa' | 'vencida';
}

// Documento de GESTION (privado): eventos/{eventoId}.
export interface Evento {
  eventoId: string;
  slug: string;
  novios: Novios;
  fecha: string; // ISO date (YYYY-MM-DD)
  lugar: Lugar;
  mensajeInvitacion: string;
  portadaUrl?: string;
  paleta?: Paleta;
  ownerUids: string[];
  plan: Plan;
  planRenovacion?: PlanRenovacion;
  acceso: { modo: ModoAcceso };
  // Catalogo de grupos de acceso de la boda (p.ej. 'General', 'Bridal Shower').
  grupos?: string[];
  maxAcompanantesDefault: number;
  estado: EstadoEvento;
  createdBy: string;
}

// Proyeccion PUBLICA (landing): publicos/{eventoId}. Solo campos no sensibles.
export interface EventoPublico {
  eventoId: string;
  slug: string;
  novios: Novios;
  fecha: string;
  lugar: Lugar;
  mensajeInvitacion: string;
  portadaUrl?: string;
  paleta?: Paleta;
  maxAcompanantesDefault: number;
  estado: EstadoEvento;
  // Modo de acceso publicado: 'publico' (RSVP abierto) o 'tokenUnico' (por llave).
  modoAcceso?: ModoAcceso;
}

// RSVP del invitado: eventos/{eventoId}/rsvps/{rsvpId}.
export interface Rsvp {
  rsvpId: string;
  nombre: string;
  asistencia: Asistencia;
  numAcompanantes: number;
  mensaje?: string;
  aceptoPolitica: boolean;
  politicaVersion: string;
  createdAt: Date | null;
}

export type RsvpInput = Omit<Rsvp, 'rsvpId' | 'createdAt'>;

// ---- Momentos: la linea de tiempo de la boda (antes / el dia / despues) ----
export type Visibilidad = 'publico' | 'privado' | 'grupos';
export type EstadoMomento = 'planeado' | 'realizado';
export type FaseMomento = 'antes' | 'dia' | 'despues';

// Momento de la boda: eventos/{eventoId}/momentos/{momentoId}.
export interface Momento {
  momentoId: string;
  eventoId: string;
  titulo: string;
  tipo: string; // id de la plantilla o 'otro'
  fase: FaseMomento;
  fecha?: string; // ISO date (YYYY-MM-DD)
  hora?: string; // HH:MM
  lugar?: string;
  descripcion?: string;
  orden: number;
  visibilidad: Visibilidad; // publico = todos; privado = solo la pareja; grupos = por audiencia
  audiencias?: string[]; // grupos que ven este momento (si visibilidad == 'grupos')
  estado: EstadoMomento;
  createdAt: Date | null;
}

export type MomentoInput = Omit<Momento, 'momentoId' | 'createdAt'>;
