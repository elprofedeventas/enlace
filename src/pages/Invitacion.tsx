// ENLACE - la INVITACION publica (/b/:slug). Sin login, sin shell del panel.
// El invitado lee la proyeccion publica y confirma su RSVP. Es la superficie
// publica: el consentimiento LOPDP (checkbox NO premarcado) es obligatorio.

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getEventoPublico } from '../services/eventos';
import { crearRsvp } from '../services/rsvps';
import { CONSENTIMIENTO_VERSION } from '../data/consentimiento';
import { OPERADORA } from '../config';
import { EstadoCarga, EstadoError, EstadoVacio, Campo } from '../components/ui';
import type { Asistencia, EventoPublico } from '../types';

export function Invitacion() {
  const { slug = '' } = useParams();
  const [evento, setEvento] = useState<EventoPublico | null | undefined>(undefined);
  const [error, setError] = useState(false);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [asistencia, setAsistencia] = useState<Asistencia>('confirmado');
  const [numAcomp, setNumAcomp] = useState('0');
  const [mensaje, setMensaje] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    getEventoPublico(slug)
      .then((ev) => {
        if (activo) setEvento(ev);
      })
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorEnvio(null);
    if (!evento) return;
    if (!acepto) {
      setErrorEnvio('Para confirmar, acepta la politica de privacidad.');
      return;
    }
    const max = evento.maxAcompanantesDefault;
    const acomp = asistencia === 'confirmado' ? Math.max(0, Math.min(max, parseInt(numAcomp, 10) || 0)) : 0;

    setEnviando(true);
    try {
      await crearRsvp(evento.eventoId, {
        nombre,
        asistencia,
        numAcompanantes: acomp,
        mensaje: mensaje || undefined,
        aceptoPolitica: true,
        politicaVersion: CONSENTIMIENTO_VERSION,
      });
      setEnviado(true);
    } catch {
      setErrorEnvio('No pudimos registrar tu confirmacion. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const acento = evento?.paleta?.acento ?? '#bb0c43';

  if (error) return <EstadoError detalle="No pudimos cargar la invitacion." />;
  if (evento === undefined) return <EstadoCarga texto="Cargando invitacion..." />;
  if (evento === null) {
    return (
      <EstadoVacio
        titulo="Invitacion no encontrada"
        detalle="Revisa el enlace que te compartieron."
      />
    );
  }
  // Solo se muestra una boda publicada; los borradores/archivados no se filtran.
  if (evento.estado !== 'publicado') {
    return (
      <EstadoVacio
        titulo="Invitacion aun no disponible"
        detalle="Vuelve a entrar mas tarde con el enlace que te compartieron."
      />
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-lg px-5 py-10">
      {/* Encabezado de la invitacion */}
      <header className="flex flex-col items-center gap-2 text-center">
        {evento.portadaUrl && (
          <img
            src={evento.portadaUrl}
            alt=""
            className="mb-2 h-40 w-full rounded object-cover"
          />
        )}
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: acento }}>
          Nos casamos
        </p>
        <h1 className="font-serif text-4xl font-bold text-[var(--enlace-text)]">
          {evento.novios.personaA} & {evento.novios.personaB}
        </h1>
        <p className="text-sm text-[var(--enlace-text-soft)]">
          {evento.fecha} · {evento.lugar.nombre}
        </p>
        {evento.lugar.direccion && (
          <p className="text-xs text-[var(--enlace-text-soft)]">{evento.lugar.direccion}</p>
        )}
      </header>

      <p className="my-8 whitespace-pre-line text-center leading-relaxed text-[var(--enlace-text)]">
        {evento.mensajeInvitacion}
      </p>

      {/* RSVP */}
      <section
        className="rounded-lg border p-5"
        style={{ borderColor: 'var(--enlace-border)' }}
      >
        {enviado ? (
          <div className="py-6 text-center">
            <p className="font-serif text-2xl" style={{ color: acento }}>
              Gracias
            </p>
            <p className="mt-1 text-sm text-[var(--enlace-text-soft)]">
              Tu respuesta quedo registrada.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <h2 className="text-center font-serif text-xl text-[var(--enlace-text)]">
              Confirma tu asistencia
            </h2>

            <Campo
              label="Tu nombre"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              required
            />

            <div className="flex gap-2">
              <BotonOpcion
                activo={asistencia === 'confirmado'}
                acento={acento}
                onClick={() => setAsistencia('confirmado')}
              >
                Si, asistire
              </BotonOpcion>
              <BotonOpcion
                activo={asistencia === 'declinado'}
                acento={acento}
                onClick={() => setAsistencia('declinado')}
              >
                No podre ir
              </BotonOpcion>
            </div>

            {asistencia === 'confirmado' && evento.maxAcompanantesDefault > 0 && (
              <Campo
                label={`Acompanantes (hasta ${evento.maxAcompanantesDefault})`}
                id="acomp"
                type="number"
                min={0}
                max={evento.maxAcompanantesDefault}
                value={numAcomp}
                onChange={(e) => setNumAcomp(e.target.value)}
              />
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="msg" className="text-sm font-medium text-[var(--enlace-text-soft)]">
                Un mensaje para la pareja (opcional)
              </label>
              <textarea
                id="msg"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2.5 text-[var(--enlace-text)] outline-none focus:border-enlace-500"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-[var(--enlace-text-soft)]">
              <input
                type="checkbox"
                checked={acepto}
                onChange={(e) => setAcepto(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Acepto que mis datos se usen para organizar este evento, segun la{' '}
                <Link to="/privacidad" className="font-medium text-enlace-500">
                  Politica de Privacidad
                </Link>
                .
              </span>
            </label>

            {errorEnvio && <p className="text-sm text-red-400">{errorEnvio}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="rounded px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: acento }}
            >
              {enviando ? 'Enviando...' : 'Confirmar'}
            </button>
          </form>
        )}
      </section>

      <footer className="mt-10 text-center text-xs text-[var(--enlace-text-soft)]">
        Hecho con ENLACE · {OPERADORA}
      </footer>
    </div>
  );
}

function BotonOpcion({
  activo,
  acento,
  onClick,
  children,
}: {
  activo: boolean;
  acento: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded border px-3 py-2.5 text-sm font-medium transition-colors"
      style={
        activo
          ? { backgroundColor: acento, color: '#fff', borderColor: acento }
          : {
              borderColor: 'var(--enlace-border)',
              color: 'var(--enlace-text-soft)',
              backgroundColor: 'transparent',
            }
      }
    >
      {children}
    </button>
  );
}
