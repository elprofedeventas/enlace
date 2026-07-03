// ENLACE - cuenta regresiva al gran dia + acciones del invitado: "Agendar"
// (descarga un .ics que funciona en Google/Apple/Outlook) y "Como llegar"
// (mapsUrl del evento, o busqueda en Google Maps con la direccion).

import { useMemo } from 'react';
import { CalendarPlus, MapPin } from 'lucide-react';
import type { EventoPublico } from '../../types';
import { descargarIcs } from './ics';
import { mensajeDelDia } from '../../data/mensajesCuenta';

// ---- Cuenta regresiva ----
// La expectativa madura con la cercania (evento de etiqueta, sin urgencia
// comercial): mas de 30 dias = "meses · dias"; de 30 a 8 = "Faltan N días";
// de 7 a 1 = "Faltan N días para… {mensaje}"; dia 0 = "Hoy es el gran día";
// pasado el dia, la cuenta se retira en silencio.
function diasHasta(fechaIso: string): number {
  const [y = 0, m = 1, d = 1] = fechaIso.split('-').map((n) => parseInt(n, 10));
  const objetivo = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86400000);
}

function mesesYDias(fechaIso: string): { meses: number; dias: number } {
  const [y = 0, m = 1, d = 1] = fechaIso.split('-').map((n) => parseInt(n, 10));
  const objetivo = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let meses =
    (objetivo.getFullYear() - hoy.getFullYear()) * 12 +
    (objetivo.getMonth() - hoy.getMonth());
  let ancla = new Date(hoy);
  ancla.setMonth(hoy.getMonth() + meses);
  if (ancla > objetivo) {
    meses -= 1;
    ancla = new Date(hoy);
    ancla.setMonth(hoy.getMonth() + meses);
  }
  const dias = Math.round((objetivo.getTime() - ancla.getTime()) / 86400000);
  return { meses, dias };
}

export function CuentaRegresiva({ fecha, slug }: { fecha: string; slug: string }) {
  // Se calcula una vez por visita: nadie deja la invitacion abierta dias enteros.
  const dias = useMemo(() => diasHasta(fecha), [fecha]);

  // Dia de la boda.
  if (dias === 0) {
    return (
      <p
        className="text-center font-serif text-3xl italic"
        style={{ color: 'var(--boda-acento)' }}
      >
        Hoy es el gran día
      </p>
    );
  }

  // Boda pasada: la cuenta se retira (el modo recuerdo llega despues).
  if (dias < 0) return null;

  // Ultima semana: dias 7 a 1, con su mensaje de la baraja.
  if (dias <= 7) {
    const mensaje = mensajeDelDia(slug, dias);
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-serif text-2xl text-[var(--enlace-text)]">
          {dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`} para…
        </p>
        <p
          className="max-w-xs font-serif text-xl italic leading-snug"
          style={{ color: 'var(--boda-acento)' }}
        >
          {mensaje}
        </p>
      </div>
    );
  }

  // De 30 a 8 dias: solo dias.
  if (dias <= 30) {
    return <Celdas celdas={[{ valor: dias, etiqueta: 'días' }]} />;
  }

  // Mas de 30 dias: meses · dias.
  const t = mesesYDias(fecha);
  return (
    <Celdas
      celdas={[
        { valor: t.meses, etiqueta: t.meses === 1 ? 'mes' : 'meses' },
        ...(t.dias > 0 ? [{ valor: t.dias, etiqueta: t.dias === 1 ? 'día' : 'días' }] : []),
      ]}
    />
  );
}

function Celdas({ celdas }: { celdas: { valor: number; etiqueta: string }[] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--enlace-text-soft)]">
        Faltan
      </p>
      <div
        className="flex items-start justify-center gap-8"
        aria-label="Tiempo restante para la boda"
      >
        {celdas.map((c) => (
          <div key={c.etiqueta} className="flex w-16 flex-col items-center">
            <span className="font-serif text-5xl font-semibold tabular-nums text-[var(--enlace-text)]">
              {c.valor}
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--enlace-text-soft)]">
              {c.etiqueta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Acciones({ evento }: { evento: EventoPublico }) {
  const urlMapa = useMemo(() => {
    if (evento.lugar.mapsUrl) return evento.lugar.mapsUrl;
    const consulta = [evento.lugar.nombre, evento.lugar.direccion].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`;
  }, [evento.lugar]);

  const claseBoton =
    'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded border px-4 py-2.5 ' +
    'text-sm font-medium text-[var(--enlace-text)] transition-colors ' +
    'hover:bg-[var(--boda-halo)] focus-visible:outline focus-visible:outline-2';

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => descargarIcs(evento)}
        className={claseBoton}
        style={{ borderColor: 'var(--boda-linea)' }}
      >
        <CalendarPlus size={16} style={{ color: 'var(--boda-acento)' }} aria-hidden="true" />
        Agendar la fecha
      </button>
      <a
        href={urlMapa}
        target="_blank"
        rel="noopener noreferrer"
        className={claseBoton}
        style={{ borderColor: 'var(--boda-linea)' }}
      >
        <MapPin size={16} style={{ color: 'var(--boda-acento)' }} aria-hidden="true" />
        Cómo llegar
      </a>
    </div>
  );
}
