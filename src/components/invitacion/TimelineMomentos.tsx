// ENLACE - "Nuestros momentos" como un hilo (enlace, literalmente): una linea
// vertical fina con nodos-medallon, un icono por tipo de momento y las fases
// (Antes / El dia / Despues) como capitulos. Los momentos realizados se marcan
// con el nodo relleno del acento.

import { Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Camera,
  Church,
  Coffee,
  FileSignature,
  Gem,
  Heart,
  Mail,
  PartyPopper,
  Plane,
  Sparkles,
} from 'lucide-react';
import type { Momento } from '../../types';
import { FASES } from '../../data/momentosPlantilla';
import { Reveal } from './Ornamentos';
import { fechaCorta } from './tema';

const ICONOS: Record<string, LucideIcon> = {
  'pedida-mano': Gem,
  'bendicion-aros': Sparkles,
  'bridal-shower': Coffee,
  'despedida-soltera': PartyPopper,
  'sesion-fotos': Camera,
  civil: FileSignature,
  eclesiastico: Church,
  'luna-miel': Plane,
  invitaciones: Mail,
};

function iconoDe(tipo: string): LucideIcon {
  return ICONOS[tipo] ?? Heart;
}

export function TimelineMomentos({ momentos }: { momentos: Momento[] }) {
  return (
    <section className="my-4" aria-label="Nuestros momentos">
      <h2 className="mb-8 text-center font-serif text-3xl text-[var(--enlace-text)]">
        Nuestros momentos
      </h2>

      {FASES.map((f) => {
        const items = momentos.filter((m) => m.fase === f.fase);
        if (items.length === 0) return null;
        return (
          <div key={f.fase} className="mb-8">
            <p
              className="mb-5 text-center text-xs font-medium uppercase tracking-[0.3em]"
              style={{ color: 'var(--boda-acento)' }}
            >
              {f.etiqueta}
            </p>

            <ol className="relative ml-5 flex flex-col gap-6 border-l pl-8" style={{ borderColor: 'var(--boda-linea)' }}>
              {items.map((m, i) => {
                const Icono = iconoDe(m.tipo);
                const realizado = m.estado === 'realizado';
                return (
                  <li key={m.momentoId} className="relative">
                    {/* Nodo-medallon sobre el hilo */}
                    <span
                      className="absolute -left-[3.05rem] top-0 flex h-10 w-10 items-center justify-center rounded-full border"
                      style={{
                        borderColor: 'var(--boda-linea)',
                        backgroundColor: realizado
                          ? 'var(--boda-acento)'
                          : 'var(--enlace-surface)',
                        color: realizado ? '#fff' : 'var(--boda-acento)',
                      }}
                      aria-hidden="true"
                    >
                      <Icono size={17} strokeWidth={1.75} />
                    </span>

                    <Reveal delay={i * 60}>
                      <div className="pt-0.5">
                        <p className="font-serif text-xl leading-snug text-[var(--enlace-text)]">
                          {m.titulo}
                          {realizado && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 align-middle text-xs font-sans"
                              style={{ color: 'var(--boda-acento)' }}
                            >
                              <Check size={13} aria-hidden="true" /> vivido
                            </span>
                          )}
                        </p>
                        {(m.fecha || m.hora || m.lugar) && (
                          <p className="mt-0.5 text-sm text-[var(--enlace-text-soft)]">
                            {[m.fecha && fechaCorta(m.fecha), m.hora, m.lugar]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        {m.descripcion && (
                          <p className="mt-1 text-sm leading-relaxed text-[var(--enlace-text-soft)]">
                            {m.descripcion}
                          </p>
                        )}
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
