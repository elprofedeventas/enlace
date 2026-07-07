// ENLACE - el RSVP como la "tarjeta de respuesta" de una suite de papeleria
// fina. Asistencia en dos tarjetas tocables, acompanantes con stepper (+/-),
// validacion inline y un "Gracias" celebratorio con confeti sutil y la opcion
// de agendar la fecha. La logica de envio (LOPDP incluido) NO cambia.

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, HeartHandshake, Minus, Plus } from 'lucide-react';
import type { Asistencia, EventoPublico, SesionInvitado } from '../../types';
import { Confeti } from './Ornamentos';
import { descargarIcs } from './ics';

interface Props {
  evento: EventoPublico;
  invitado?: SesionInvitado | null;
  enviando: boolean;
  enviado: boolean;
  errorEnvio: string | null;
  onEnviar: (datos: {
    nombre: string;
    asistencia: Asistencia;
    numAcompanantes: number;
    mensaje: string;
    acepto: boolean;
  }) => void;
}

export function RsvpCard({ evento, invitado, enviando, enviado, errorEnvio, onEnviar }: Props) {
  const [nombre, setNombre] = useState(invitado?.nombre ?? '');
  const [asistencia, setAsistencia] = useState<Asistencia>('confirmado');
  const [acomp, setAcomp] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [acepto, setAcepto] = useState(false);
  const [tocado, setTocado] = useState(false);

  const max = invitado ? Math.max(0, invitado.admisiones - 1) : evento.maxAcompanantesDefault;
  const nombreValido = nombre.trim().length >= 2;

  function submit(e: FormEvent) {
    e.preventDefault();
    setTocado(true);
    if (!nombreValido) return;
    onEnviar({ nombre: nombre.trim(), asistencia, numAcompanantes: acomp, mensaje, acepto });
  }

  if (enviado) {
    return (
      <section
        className="relative overflow-hidden rounded-lg border p-8 text-center"
        style={{ borderColor: 'var(--boda-linea)', backgroundColor: 'var(--enlace-surface)' }}
      >
        <Confeti />
        <HeartHandshake
          size={34}
          strokeWidth={1.5}
          className="mx-auto"
          style={{ color: 'var(--boda-acento)' }}
          aria-hidden="true"
        />
        <p className="mt-3 font-serif text-3xl italic" style={{ color: 'var(--boda-acento)' }}>
          ¡Gracias!
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--enlace-text-soft)]">
          {asistencia === 'confirmado'
            ? `${evento.novios.personaA} y ${evento.novios.personaB} te esperan con mucha ilusión.`
            : 'Tu respuesta quedó registrada. Gracias por avisar con cariño.'}
        </p>
        {asistencia === 'confirmado' && (
          <button
            type="button"
            onClick={() => descargarIcs(evento)}
            className="mx-auto mt-5 flex min-h-[44px] items-center gap-2 rounded border px-4 py-2.5 text-sm font-medium text-[var(--enlace-text)] transition-colors hover:bg-[var(--boda-halo)]"
            style={{ borderColor: 'var(--boda-linea)' }}
          >
            <CalendarPlus size={16} style={{ color: 'var(--boda-acento)' }} aria-hidden="true" />
            Guarda la fecha en tu calendario
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border p-6"
      style={{ borderColor: 'var(--boda-linea)', backgroundColor: 'var(--enlace-surface)' }}
    >
      <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[var(--enlace-text)]">
            Confirma tu asistencia
          </h2>
          <p className="mt-1 text-sm text-[var(--enlace-text-soft)]">
            Tu respuesta ayuda a preparar cada detalle.
          </p>
        </div>

        {/* Nombre: con llave viene puesto; sin llave se escribe */}
        {invitado ? (
          <p className="text-center text-sm text-[var(--enlace-text-soft)]">
            Confirmas como{' '}
            <span className="font-medium text-[var(--enlace-text)]">{invitado.nombre}</span>
            {max > 0 && <> · hasta {max} {max === 1 ? 'acompañante' : 'acompañantes'}</>}
          </p>
        ) : (
        <div className="flex flex-col gap-1">
          <label htmlFor="inv-nombre" className="text-sm font-medium text-[var(--enlace-text-soft)]">
            Tu nombre
          </label>
          <input
            id="inv-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setTocado(true)}
            maxLength={120}
            required
            autoComplete="name"
            aria-invalid={tocado && !nombreValido}
            className="min-h-[44px] w-full rounded border bg-[var(--enlace-surface-2)] px-3 py-2.5 text-[var(--enlace-text)] outline-none transition-colors focus:border-[var(--boda-acento)]"
            style={{ borderColor: tocado && !nombreValido ? '#f87171' : 'var(--enlace-border)' }}
          />
          {tocado && !nombreValido && (
            <p className="text-xs text-red-400">Escribe tu nombre para poder confirmarte.</p>
          )}
        </div>
        )}

        {/* Asistencia: dos tarjetas tocables */}
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="¿Asistirás?">
          <TarjetaOpcion
            activa={asistencia === 'confirmado'}
            onClick={() => setAsistencia('confirmado')}
            titulo="Sí, asistiré"
            detalle="Ahí estaré"
          />
          <TarjetaOpcion
            activa={asistencia === 'declinado'}
            onClick={() => setAsistencia('declinado')}
            titulo="No podré ir"
            detalle="Los acompaño de corazón"
          />
        </div>

        {/* Acompanantes: stepper */}
        {asistencia === 'confirmado' && max > 0 && (
          <div className="flex items-center justify-between rounded border px-4 py-3" style={{ borderColor: 'var(--enlace-border)' }}>
            <div>
              <p className="text-sm font-medium text-[var(--enlace-text)]">Acompañantes</p>
              <p className="text-xs text-[var(--enlace-text-soft)]">Hasta {max} por invitación</p>
            </div>
            <div className="flex items-center gap-3">
              <BotonStepper
                onClick={() => setAcomp((n) => Math.max(0, n - 1))}
                deshabilitado={acomp <= 0}
                etiqueta="Quitar acompañante"
              >
                <Minus size={16} aria-hidden="true" />
              </BotonStepper>
              <span className="w-6 text-center font-serif text-2xl tabular-nums text-[var(--enlace-text)]">
                {acomp}
              </span>
              <BotonStepper
                onClick={() => setAcomp((n) => Math.min(max, n + 1))}
                deshabilitado={acomp >= max}
                etiqueta="Agregar acompañante"
              >
                <Plus size={16} aria-hidden="true" />
              </BotonStepper>
            </div>
          </div>
        )}

        {/* Mensaje opcional */}
        <div className="flex flex-col gap-1">
          <label htmlFor="inv-msg" className="text-sm font-medium text-[var(--enlace-text-soft)]">
            Un mensaje para la pareja <span className="font-normal">(opcional)</span>
          </label>
          <textarea
            id="inv-msg"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Unas palabras de cariño…"
            className="w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2.5 text-[var(--enlace-text)] outline-none transition-colors placeholder:text-[var(--enlace-text-soft)] focus:border-[var(--boda-acento)]"
          />
        </div>

        {/* Consentimiento LOPDP: NUNCA premarcado */}
        <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--enlace-text-soft)]">
          <input
            type="checkbox"
            checked={acepto}
            onChange={(e) => setAcepto(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            Acepto que mis datos se usen para organizar este evento, según la{' '}
            <Link to="/privacidad" className="font-medium underline" style={{ color: 'var(--boda-acento)' }}>
              Política de Privacidad
            </Link>
            .
          </span>
        </label>

        {errorEnvio && (
          <p className="text-sm text-red-400" role="alert">
            {errorEnvio}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-[48px] rounded px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: 'var(--boda-acento)' }}
        >
          {enviando ? 'Enviando…' : 'Confirmar'}
        </button>
      </form>
    </section>
  );
}

function TarjetaOpcion({
  activa,
  onClick,
  titulo,
  detalle,
}: {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  detalle: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activa}
      onClick={onClick}
      className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded border px-3 py-3 text-center transition-colors"
      style={
        activa
          ? {
              borderColor: 'var(--boda-acento)',
              backgroundColor: 'var(--boda-relleno)',
              color: 'var(--enlace-text)',
            }
          : {
              borderColor: 'var(--enlace-border)',
              color: 'var(--enlace-text-soft)',
              backgroundColor: 'transparent',
            }
      }
    >
      <span className="text-sm font-semibold">{titulo}</span>
      <span className="text-xs opacity-80">{detalle}</span>
    </button>
  );
}

function BotonStepper({
  onClick,
  deshabilitado,
  etiqueta,
  children,
}: {
  onClick: () => void;
  deshabilitado: boolean;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={etiqueta}
      className="flex h-11 w-11 items-center justify-center rounded-full border text-[var(--enlace-text)] transition-colors hover:bg-[var(--boda-halo)] disabled:opacity-35"
      style={{ borderColor: 'var(--boda-linea)' }}
    >
      {children}
    </button>
  );
}
