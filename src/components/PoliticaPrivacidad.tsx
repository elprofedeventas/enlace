// ENLACE - Politica de Privacidad (LOPDP). Pagina publica enlazada desde el
// formulario de RSVP y desde "Mi cuenta".

import { Link } from 'react-router-dom';
import { POLITICA_TITULO, POLITICA_SECCIONES } from '../data/consentimiento';
import { OPERADORA } from '../config';

export function PoliticaPrivacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-[var(--enlace-text)]">{POLITICA_TITULO}</h1>
      <div className="flex flex-col gap-4">
        {POLITICA_SECCIONES.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-1 text-base font-semibold text-[var(--enlace-text)]">{s.titulo}</h2>
            <p className="text-sm leading-relaxed text-[var(--enlace-text-soft)]">{s.cuerpo}</p>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-[var(--enlace-text-soft)]">Operado por {OPERADORA}.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-enlace-500">
        Volver
      </Link>
    </div>
  );
}
