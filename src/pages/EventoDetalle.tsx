// ENLACE - detalle de una boda con los RSVP EN TIEMPO REAL (cierra el walking
// skeleton: el operador ve la confirmacion del invitado al instante). Listener
// acotado a este evento.

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { escucharRsvps } from '../services/rsvps';
import { getEvento } from '../services/eventos';
import { EstadoCarga, EstadoError, EstadoVacio, Card } from '../components/ui';
import type { Evento, Rsvp } from '../types';

export function EventoDetalle() {
  const { slug = '' } = useParams();
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [rsvps, setRsvps] = useState<Rsvp[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    getEvento(slug)
      .then((ev) => {
        if (activo) setEvento(ev);
      })
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [slug]);

  // Solo escuchamos RSVPs cuando el evento existe (evita un listener huerfano
  // sobre una boda inexistente o sin acceso).
  useEffect(() => {
    if (!evento) return;
    const unsub = escucharRsvps(
      slug,
      (data) => setRsvps(data),
      () => setError(true),
    );
    return unsub;
  }, [slug, evento]);

  const resumen = useMemo(() => {
    const lista = rsvps ?? [];
    const confirmados = lista.filter((r) => r.asistencia === 'confirmado');
    const personas = confirmados.reduce((acc, r) => acc + 1 + r.numAcompanantes, 0);
    return {
      confirmados: confirmados.length,
      declinados: lista.length - confirmados.length,
      personas,
    };
  }, [rsvps]);

  if (error) return <EstadoError detalle="No pudimos cargar esta boda." />;
  if (evento === undefined) return <EstadoCarga texto="Cargando boda..." />;
  if (evento === null) {
    return <EstadoVacio titulo="Boda no encontrada" detalle="Quiza fue archivada o el enlace cambio." />;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <h1 className="font-serif text-xl font-bold text-[var(--enlace-text)]">
          {evento.novios.personaA} & {evento.novios.personaB}
        </h1>
        <Link to={`/b/${slug}`} className="text-sm font-medium text-enlace-500">
          Ver invitacion publica (/b/{slug})
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center">
          <p className="text-2xl font-bold text-enlace-500">{resumen.confirmados}</p>
          <p className="text-xs text-[var(--enlace-text-soft)]">Confirman</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--enlace-text)]">{resumen.personas}</p>
          <p className="text-xs text-[var(--enlace-text-soft)]">Personas</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--enlace-text-soft)]">{resumen.declinados}</p>
          <p className="text-xs text-[var(--enlace-text-soft)]">No asisten</p>
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-[var(--enlace-text-soft)]">Confirmaciones</h2>

      {rsvps === null ? (
        <EstadoCarga texto="Escuchando confirmaciones..." />
      ) : rsvps.length === 0 ? (
        <EstadoVacio
          titulo="Aun nadie confirma"
          detalle="Cuando un invitado responda, aparecera aqui al instante."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rsvps.map((r) => (
            <li key={r.rsvpId}>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--enlace-text)]">{r.nombre}</p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      r.asistencia === 'confirmado'
                        ? 'bg-enlace-600/20 text-enlace-400'
                        : 'bg-[var(--enlace-surface-2)] text-[var(--enlace-text-soft)]'
                    }`}
                  >
                    {r.asistencia === 'confirmado'
                      ? `Asiste +${r.numAcompanantes}`
                      : 'No asiste'}
                  </span>
                </div>
                {r.mensaje && (
                  <p className="mt-1 text-sm text-[var(--enlace-text-soft)]">{r.mensaje}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
