// ENLACE - la INVITACION publica (/b/:slug). Sin login, sin shell del panel.
// El invitado lee la proyeccion publica y confirma su RSVP. Es la superficie
// publica: el consentimiento LOPDP (checkbox NO premarcado) es obligatorio.
//
// UX-1: la pagina compone las piezas de components/invitacion/ (hero, cuenta
// regresiva, acciones, hilo de momentos, tarjeta RSVP). La capa de servicios y
// la logica de seguridad NO cambian: solo la presentacion.

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getEventoPublico } from '../services/eventos';
import { crearRsvp } from '../services/rsvps';
import { listarMomentosPublicos } from '../services/momentos';
import { CONSENTIMIENTO_VERSION } from '../data/consentimiento';
import { OPERADORA } from '../config';
import type { Asistencia, EventoPublico, Momento } from '../types';
import { temaInvitacion } from '../components/invitacion/tema';
import { Hero } from '../components/invitacion/Hero';
import { CuentaRegresiva, Acciones } from '../components/invitacion/CuentaYAcciones';
import { TimelineMomentos } from '../components/invitacion/TimelineMomentos';
import { RsvpCard } from '../components/invitacion/RsvpCard';
import { Monograma, Reveal, Separador } from '../components/invitacion/Ornamentos';

export function Invitacion() {
  const { slug = '' } = useParams();
  const [evento, setEvento] = useState<EventoPublico | null | undefined>(undefined);
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [error, setError] = useState(false);

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
    // Los momentos publicos son complementarios: si fallan, no rompen la invitacion.
    listarMomentosPublicos(slug)
      .then((ms) => {
        if (activo) setMomentos(ms);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [slug]);

  async function enviarRsvp(datos: {
    nombre: string;
    asistencia: Asistencia;
    numAcompanantes: number;
    mensaje: string;
    acepto: boolean;
  }) {
    setErrorEnvio(null);
    if (!evento) return;
    if (!datos.acepto) {
      setErrorEnvio('Para confirmar, acepta la política de privacidad.');
      return;
    }
    const max = evento.maxAcompanantesDefault;
    const acomp =
      datos.asistencia === 'confirmado'
        ? Math.max(0, Math.min(max, datos.numAcompanantes))
        : 0;

    setEnviando(true);
    try {
      await crearRsvp(evento.eventoId, {
        nombre: datos.nombre,
        asistencia: datos.asistencia,
        numAcompanantes: acomp,
        mensaje: datos.mensaje || undefined,
        aceptoPolitica: true,
        politicaVersion: CONSENTIMIENTO_VERSION,
      });
      setEnviado(true);
    } catch {
      setErrorEnvio('No pudimos registrar tu confirmación. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (error) return <EstadoInvitacion titulo="Algo salió mal" detalle="No pudimos cargar la invitación. Revisa tu conexión e intenta de nuevo." />;
  if (evento === undefined) return <CargaInvitacion />;
  if (evento === null) {
    return (
      <EstadoInvitacion
        titulo="Invitación no encontrada"
        detalle="Revisa el enlace que te compartieron: puede que falte una letra."
      />
    );
  }
  // Solo se muestra una boda publicada; los borradores/archivados no se filtran.
  if (evento.estado !== 'publicado') {
    return (
      <EstadoInvitacion
        titulo="Esta invitación aún no está lista"
        detalle="La pareja está preparando los últimos detalles. Vuelve pronto con el mismo enlace."
      />
    );
  }

  const acento = evento.paleta?.acento ?? '#bb0c43';

  return (
    <div className="min-h-full" style={temaInvitacion(acento)}>
      <Hero evento={evento} />

      <main className="mx-auto max-w-lg px-6 pb-14">
        <Reveal>
          <div className="pt-10">
            <CuentaRegresiva fecha={evento.fecha} slug={evento.slug} />
          </div>
        </Reveal>

        <Separador />

        <Reveal>
          <p className="whitespace-pre-line text-center font-serif text-lg leading-relaxed text-[var(--enlace-text)]">
            {evento.mensajeInvitacion}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-8">
            <Acciones evento={evento} />
          </div>
        </Reveal>

        {momentos.length > 0 && (
          <>
            <Separador />
            <TimelineMomentos momentos={momentos} />
          </>
        )}

        <Separador />

        <Reveal>
          <RsvpCard
            evento={evento}
            enviando={enviando}
            enviado={enviado}
            errorEnvio={errorEnvio}
            onEnviar={enviarRsvp}
          />
        </Reveal>

        <footer className="mt-12 flex flex-col items-center gap-1 text-center">
          <span className="h-px w-10 bg-[var(--boda-linea)]" aria-hidden="true" />
          <p className="mt-2 text-[11px] tracking-wide text-[var(--enlace-text-soft)]">
            Hecho con <span className="font-serif italic">ENLACE</span> · {OPERADORA}
          </p>
        </footer>
      </main>
    </div>
  );
}

// Estados con marca: la invitacion nunca muestra el generico del panel.
function EstadoInvitacion({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div
      className="flex min-h-[100svh] flex-col items-center justify-center gap-3 px-8 text-center"
      style={temaInvitacion('#bb0c43')}
    >
      <Monograma a="E" b="N" size={72} />
      <p className="font-serif text-2xl text-[var(--enlace-text)]">{titulo}</p>
      <p className="max-w-xs text-sm leading-relaxed text-[var(--enlace-text-soft)]">{detalle}</p>
    </div>
  );
}

function CargaInvitacion() {
  return (
    <div
      className="flex min-h-[100svh] flex-col items-center justify-center gap-4"
      style={temaInvitacion('#bb0c43')}
    >
      <span className="inv-pulso h-2 w-2 rounded-full" aria-hidden="true" />
      <p className="text-sm text-[var(--enlace-text-soft)]" role="status">
        Preparando la invitación…
      </p>
    </div>
  );
}
