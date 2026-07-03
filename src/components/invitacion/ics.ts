// ENLACE - generacion del archivo .ics (calendario) de la boda. Funciona en
// Google Calendar, Apple Calendar y Outlook. Evento de dia completo.

import type { EventoPublico } from '../../types';

function icsDelEvento(evento: EventoPublico): string {
  const inicio = evento.fecha.replace(/-/g, '');
  const [y = 0, m = 1, d = 1] = evento.fecha.split('-').map((n) => parseInt(n, 10));
  const finDate = new Date(y, m - 1, d + 1);
  const fin = `${finDate.getFullYear()}${String(finDate.getMonth() + 1).padStart(2, '0')}${String(
    finDate.getDate(),
  ).padStart(2, '0')}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lugar = [evento.lugar.nombre, evento.lugar.direccion].filter(Boolean).join(', ');
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ENLACE//Invitacion//ES',
    'BEGIN:VEVENT',
    `UID:${evento.slug}@enlace.nuevaorbita.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${inicio}`,
    `DTEND;VALUE=DATE:${fin}`,
    `SUMMARY:${esc(`Boda de ${evento.novios.personaA} y ${evento.novios.personaB}`)}`,
    `LOCATION:${esc(lugar)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function descargarIcs(evento: EventoPublico) {
  const blob = new Blob([icsDelEvento(evento)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `boda-${evento.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

