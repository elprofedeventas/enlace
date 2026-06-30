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
