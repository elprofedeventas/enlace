// ENLACE - gestor de la linea de tiempo de una boda (Corte 1). El operador anade
// momentos desde la plantilla o personalizados, los edita, ordena y marca
// publico/privado. Los publicos se veran en la invitacion.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  listarMomentos,
  crearMomento,
  actualizarMomento,
  eliminarMomento,
  intercambiarOrden,
} from '../services/momentos';
import { MOMENTOS_PLANTILLA, FASES } from '../data/momentosPlantilla';
import { EstadoCarga, EstadoError, EstadoVacio, Card } from '../components/ui';
import type { Momento, MomentoInput } from '../types';

export function MomentosEditor() {
  const { slug = '' } = useParams();
  const [momentos, setMomentos] = useState<Momento[] | null>(null);
  const [error, setError] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      setMomentos(await listarMomentos(slug));
    } catch {
      setError(true);
    }
  }, [slug]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const tiposUsados = useMemo(() => new Set((momentos ?? []).map((m) => m.tipo)), [momentos]);
  const maxOrden = useMemo(
    () => (momentos ?? []).reduce((max, m) => Math.max(max, m.orden), 0),
    [momentos],
  );

  async function anadirDePlantilla(tipo: string) {
    const p = MOMENTOS_PLANTILLA.find((x) => x.tipo === tipo);
    if (!p || ocupado) return;
    setOcupado(true);
    try {
      const nuevo: MomentoInput = {
        eventoId: slug,
        titulo: p.titulo,
        tipo: p.tipo,
        fase: p.fase,
        orden: p.orden,
        visibilidad: p.visibilidadDefecto,
        estado: 'planeado',
        ...(p.descripcion ? { descripcion: p.descripcion } : {}),
      };
      await crearMomento(slug, nuevo);
      await cargar();
    } finally {
      setOcupado(false);
    }
  }

  async function anadirPersonalizado() {
    if (ocupado) return;
    setOcupado(true);
    try {
      await crearMomento(slug, {
        eventoId: slug,
        titulo: 'Nuevo momento',
        tipo: 'otro',
        fase: 'antes',
        orden: maxOrden + 10,
        visibilidad: 'privado',
        estado: 'planeado',
      });
      await cargar();
    } finally {
      setOcupado(false);
    }
  }

  async function guardar(m: Momento, cambios: Partial<MomentoInput>) {
    await actualizarMomento(slug, m.momentoId, cambios);
    await cargar();
  }

  async function borrar(m: Momento) {
    if (!confirm(`Eliminar "${m.titulo}"?`)) return;
    await eliminarMomento(slug, m.momentoId);
    await cargar();
  }

  async function mover(i: number, dir: -1 | 1) {
    if (!momentos) return;
    const j = i + dir;
    if (j < 0 || j >= momentos.length) return;
    await intercambiarOrden(slug, momentos[i]!, momentos[j]!);
    await cargar();
  }

  if (error) return <EstadoError detalle="No pudimos cargar los momentos." onReintentar={cargar} />;
  if (momentos === null) return <EstadoCarga texto="Cargando momentos..." />;

  const pendientesPlantilla = MOMENTOS_PLANTILLA.filter((p) => !tiposUsados.has(p.tipo));

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <Link to={`/eventos/${slug}`} className="text-sm font-medium text-enlace-500">
          &larr; Volver a la boda
        </Link>
        <h1 className="mt-1 text-lg font-bold text-[var(--enlace-text)]">Momentos de la boda</h1>
        <p className="text-sm text-[var(--enlace-text-soft)]">
          Los <strong>publicos</strong> se ven en la invitacion; los <strong>privados</strong> solo
          aqui.
        </p>
      </div>

      {/* Anadir desde la plantilla */}
      {pendientesPlantilla.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold text-[var(--enlace-text)]">Anadir momento</p>
          <div className="flex flex-wrap gap-2">
            {pendientesPlantilla.map((p) => (
              <button
                key={p.tipo}
                type="button"
                disabled={ocupado}
                onClick={() => anadirDePlantilla(p.tipo)}
                className="rounded-full border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--enlace-text)] hover:border-enlace-500 disabled:opacity-50"
              >
                + {p.titulo}
              </button>
            ))}
          </div>
        </Card>
      )}

      <button
        type="button"
        disabled={ocupado}
        onClick={anadirPersonalizado}
        className="self-start rounded border border-dashed border-[var(--enlace-border)] px-3 py-2 text-sm font-medium text-[var(--enlace-text-soft)] hover:text-[var(--enlace-text)] disabled:opacity-50"
      >
        + Momento personalizado
      </button>

      {momentos.length === 0 ? (
        <EstadoVacio
          titulo="Aun no hay momentos"
          detalle="Anade el primero desde la plantilla de arriba."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {momentos.map((m, i) => (
            <li key={m.momentoId}>
              <MomentoCard
                momento={m}
                primero={i === 0}
                ultimo={i === momentos.length - 1}
                onGuardar={(c) => guardar(m, c)}
                onBorrar={() => borrar(m)}
                onSubir={() => mover(i, -1)}
                onBajar={() => mover(i, 1)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MomentoCard({
  momento,
  primero,
  ultimo,
  onGuardar,
  onBorrar,
  onSubir,
  onBajar,
}: {
  momento: Momento;
  primero: boolean;
  ultimo: boolean;
  onGuardar: (cambios: Partial<MomentoInput>) => Promise<void>;
  onBorrar: () => Promise<void>;
  onSubir: () => Promise<void>;
  onBajar: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState(momento.titulo);
  const [fase, setFase] = useState(momento.fase);
  const [fecha, setFecha] = useState(momento.fecha ?? '');
  const [hora, setHora] = useState(momento.hora ?? '');
  const [lugar, setLugar] = useState(momento.lugar ?? '');
  const [descripcion, setDescripcion] = useState(momento.descripcion ?? '');
  const [visibilidad, setVisibilidad] = useState(momento.visibilidad);
  const [estado, setEstado] = useState(momento.estado);
  const [guardando, setGuardando] = useState(false);

  const inputCls =
    'w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2 text-sm text-[var(--enlace-text)] outline-none focus:border-enlace-500';

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar({
        eventoId: momento.eventoId,
        tipo: momento.tipo,
        orden: momento.orden,
        titulo: titulo.trim() || 'Sin titulo',
        fase,
        fecha,
        hora,
        lugar,
        descripcion,
        visibilidad,
        estado,
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={120}
          className="flex-1 bg-transparent text-base font-semibold text-[var(--enlace-text)] outline-none"
        />
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onSubir}
            disabled={primero}
            aria-label="Subir"
            className="rounded px-2 py-1 text-sm text-[var(--enlace-text-soft)] disabled:opacity-30"
          >
            &uarr;
          </button>
          <button
            type="button"
            onClick={onBajar}
            disabled={ultimo}
            aria-label="Bajar"
            className="rounded px-2 py-1 text-sm text-[var(--enlace-text-soft)] disabled:opacity-30"
          >
            &darr;
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <select value={fase} onChange={(e) => setFase(e.target.value as Momento['fase'])} className={inputCls}>
          {FASES.map((f) => (
            <option key={f.fase} value={f.fase}>
              {f.etiqueta}
            </option>
          ))}
        </select>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
        <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputCls} />
        <input
          placeholder="Lugar"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          maxLength={200}
          className={inputCls}
        />
      </div>

      <textarea
        placeholder="Descripcion"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={2}
        maxLength={2000}
        className={`${inputCls} mt-2`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setVisibilidad((v) => (v === 'publico' ? 'privado' : 'publico'))}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            visibilidad === 'publico'
              ? 'bg-enlace-600/20 text-enlace-400'
              : 'bg-[var(--enlace-surface-2)] text-[var(--enlace-text-soft)]'
          }`}
        >
          {visibilidad === 'publico' ? 'Publico' : 'Privado'}
        </button>
        <button
          type="button"
          onClick={() => setEstado((s) => (s === 'realizado' ? 'planeado' : 'realizado'))}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            estado === 'realizado'
              ? 'bg-enlace-600/20 text-enlace-400'
              : 'bg-[var(--enlace-surface-2)] text-[var(--enlace-text-soft)]'
          }`}
        >
          {estado === 'realizado' ? 'Realizado' : 'Planeado'}
        </button>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={onBorrar}
            className="rounded px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="rounded bg-enlace-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-enlace-700 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </Card>
  );
}
