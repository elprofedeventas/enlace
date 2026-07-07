// ENLACE - hero de la invitacion. La primera impresion del invitado: pantalla
// completa, nombres grandes en serif con "&" ornamental. Con portada, la foto
// manda con un velo de legibilidad; sin portada, un fondo con halos del acento
// y el monograma-sello de la pareja.

import type { EventoPublico } from '../../types';
import { Monograma } from './Ornamentos';
import { fechaLarga, iniciales } from './tema';

export function Hero({ evento, invitadoNombre }: { evento: EventoPublico; invitadoNombre?: string }) {
  const [iniA, iniB] = iniciales(evento.novios.personaA, evento.novios.personaB);
  const conPortada = Boolean(evento.portadaUrl);

  return (
    <header className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {conPortada ? (
        <>
          <img
            src={evento.portadaUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Velo: garantiza legibilidad sobre cualquier foto, en ambos temas. */}
          <div className="absolute inset-0 bg-gradient-to-b from-[color-mix(in_srgb,var(--enlace-bg)_35%,transparent)] via-[color-mix(in_srgb,var(--enlace-bg)_55%,transparent)] to-[var(--enlace-bg)]" />
        </>
      ) : (
        <div className="absolute inset-0" aria-hidden="true">
          {/* Halos suaves del acento: papel con luz, no fondo plano. */}
          <div
            className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--boda-halo)' }}
          />
          <div
            className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full blur-3xl"
            style={{ backgroundColor: 'var(--boda-halo)' }}
          />
        </div>
      )}

      <div className="inv-hero-entrada relative flex flex-col items-center gap-4">
        {!conPortada && <Monograma a={iniA} b={iniB} />}

        {invitadoNombre && (
          <p className="font-serif text-lg italic text-[var(--enlace-text-soft)]">
            Hola, {invitadoNombre}
          </p>
        )}
        <p
          className="text-xs font-medium uppercase tracking-[0.35em]"
          style={{ color: 'var(--boda-acento)' }}
        >
          Nos casamos
        </p>

        <h1 className="font-serif leading-none text-[var(--enlace-text)]">
          <span className="block text-5xl font-semibold sm:text-6xl">
            {evento.novios.personaA}
          </span>
          <span
            className="my-1 block font-serif text-3xl italic sm:text-4xl"
            style={{ color: 'var(--boda-acento)' }}
            aria-hidden="true"
          >
            &amp;
          </span>
          <span className="block text-5xl font-semibold sm:text-6xl">
            {evento.novios.personaB}
          </span>
        </h1>

        <div className="mt-2 flex flex-col items-center gap-1">
          <p className="font-serif text-lg text-[var(--enlace-text)]">
            {fechaLarga(evento.fecha)}
          </p>
          <p className="text-sm tracking-wide text-[var(--enlace-text-soft)]">
            {evento.lugar.nombre}
          </p>
          {evento.lugar.direccion && (
            <p className="text-xs text-[var(--enlace-text-soft)]">{evento.lugar.direccion}</p>
          )}
        </div>
      </div>

      {/* Invitacion a seguir bajando: hilo fino que respira. */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <span className="inv-hilo-scroll block h-10 w-px" />
      </div>
    </header>
  );
}
