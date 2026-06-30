// ENLACE - panel: lista de bodas del operador. Estados cargando/vacio/error.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarEventos } from '../services/eventos';
import { EstadoCarga, EstadoError, EstadoVacio, Card } from '../components/ui';
import type { Evento } from '../types';

export function Panel() {
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    setEventos(null);
    try {
      setEventos(await listarEventos());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (error) return <EstadoError detalle="No pudimos cargar las bodas." onReintentar={cargar} />;
  if (eventos === null) return <EstadoCarga texto="Cargando bodas..." />;

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-lg font-bold text-[var(--enlace-text)]">Bodas</h1>

      {eventos.length === 0 ? (
        <EstadoVacio
          titulo="Aun no hay bodas"
          detalle="Crea la primera con el boton + de abajo."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {eventos.map((ev) => (
            <li key={ev.eventoId}>
              <Link to={`/eventos/${ev.eventoId}`}>
                <Card className="transition-colors hover:border-enlace-500">
                  <p className="font-serif text-lg font-semibold text-[var(--enlace-text)]">
                    {ev.novios.personaA} & {ev.novios.personaB}
                  </p>
                  <p className="text-sm text-[var(--enlace-text-soft)]">
                    {ev.fecha} · {ev.lugar.nombre}
                  </p>
                  <p className="mt-1 text-xs text-[var(--enlace-text-soft)]">
                    /b/{ev.slug} · {ev.estado}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
