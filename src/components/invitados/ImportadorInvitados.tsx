// ENLACE - importador de invitados desde Excel (Pantalla D, ENLACE-3). Modal:
// descargar plantilla -> subir .xlsx -> vista previa validada -> confirmar ->
// alta en lote (services). Los grupos nuevos del Excel se crean automaticamente
// (se muestran antes de confirmar). No toca reglas ni el portero.

import { useMemo, useRef, useState } from 'react';
import { FileDown, Upload, X } from 'lucide-react';
import { descargarPlantilla, parsearYValidar, type ResultadoImport } from '../../utils/invitadosExcel';
import { setGrupos } from '../../services/eventos';
import { crearInvitadosEnLote } from '../../services/invitados';
import { Spinner } from '../ui';

const MAX_GRUPOS = 30;

type Fase = 'inicio' | 'previa' | 'importando';

export function ImportadorInvitados({
  slug,
  gruposExistentes,
  onCerrar,
  onImportado,
}: {
  slug: string;
  gruposExistentes: string[];
  onCerrar: () => void;
  onImportado: (cantidad: number) => void;
}) {
  const [fase, setFase] = useState<Fase>('inicio');
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filasOk = useMemo(() => resultado?.filas.filter((f) => f.ok) ?? [], [resultado]);
  const conProblema = (resultado?.filas.length ?? 0) - filasOk.length;
  const gruposNuevos = resultado?.gruposNuevosTotales ?? [];
  const totalGrupos = gruposExistentes.length + gruposNuevos.length;
  const excedeGrupos = totalGrupos > MAX_GRUPOS;
  const puedeConfirmar = filasOk.length > 0 && !excedeGrupos;

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = ''; // permite reelegir el mismo archivo
    if (!file) return;
    setErrorArchivo(null);
    try {
      const res = await parsearYValidar(file, gruposExistentes);
      if (res.filas.length === 0) {
        setErrorArchivo('El archivo no tiene filas. Usa la plantilla y agrega al menos un invitado.');
        return;
      }
      setResultado(res);
      setFase('previa');
    } catch {
      setErrorArchivo('No pudimos leer el archivo. Verifica que sea un .xlsx valido.');
    }
  }

  async function confirmar() {
    if (!puedeConfirmar) return;
    setFase('importando');
    try {
      if (gruposNuevos.length > 0) {
        await setGrupos(slug, [...gruposExistentes, ...gruposNuevos]);
      }
      const creados = await crearInvitadosEnLote(
        slug,
        filasOk.map((f) => ({ nombre: f.nombre, admisiones: f.admisiones, grupos: f.grupos })),
      );
      onImportado(creados);
      onCerrar();
    } catch {
      setErrorArchivo('No pudimos importar. Revisa tu conexion e intenta de nuevo.');
      setFase('previa');
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 px-3 py-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Importar invitados desde Excel"
    >
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[var(--enlace-border)] bg-[var(--enlace-surface)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-[var(--enlace-border)] px-5 py-4">
          <h2 className="font-serif text-xl text-[var(--enlace-text)]">Importar desde Excel</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--enlace-text-soft)] hover:text-[var(--enlace-text)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {fase === 'importando' ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Spinner />
              <p className="text-sm text-[var(--enlace-text-soft)]" role="status">
                Importando invitados y creando sus llaves...
              </p>
            </div>
          ) : fase === 'inicio' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-[var(--enlace-text-soft)]">
                Usa una hoja con tres columnas: <strong>Nombre</strong> (obligatoria),{' '}
                <strong>Admisiones</strong> (obligatoria, entero de 1 a 21) y{' '}
                <strong>Grupos</strong> (opcional, separados por coma). Descarga la plantilla,
                completala y subela.
              </p>

              <button
                type="button"
                onClick={descargarPlantilla}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-4 text-sm font-medium text-[var(--enlace-text)]"
              >
                <FileDown size={16} aria-hidden="true" /> Descargar plantilla
              </button>

              <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded bg-enlace-700 px-4 text-sm font-semibold text-white">
                <Upload size={16} aria-hidden="true" /> Subir archivo .xlsx
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={onArchivo}
                  className="hidden"
                />
              </label>

              {errorArchivo && <p className="text-sm text-red-400">{errorArchivo}</p>}
            </div>
          ) : (
            resultado && (
              <div className="flex flex-col gap-3">
                {/* Resumen */}
                <div className="rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] p-3 text-sm">
                  <p className="text-[var(--enlace-text)]">
                    <strong>{filasOk.length}</strong>{' '}
                    {filasOk.length === 1 ? 'invitado listo' : 'invitados listos'} para importar
                    {conProblema > 0 && (
                      <>
                        {' '}
                        · <span className="text-red-400">{conProblema} con problemas (se omiten)</span>
                      </>
                    )}
                    .
                  </p>
                  {gruposNuevos.length > 0 && (
                    <p className="mt-1 text-[var(--enlace-text-soft)]">
                      Se crearan {gruposNuevos.length}{' '}
                      {gruposNuevos.length === 1 ? 'grupo nuevo' : 'grupos nuevos'}:{' '}
                      <span className="text-[var(--enlace-text)]">{gruposNuevos.join(', ')}</span>.
                    </p>
                  )}
                </div>

                {excedeGrupos && (
                  <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                    La boda quedaria con {totalGrupos} grupos y el maximo es {MAX_GRUPOS}. Reduce los
                    grupos del Excel antes de importar.
                  </p>
                )}

                {/* Filas */}
                <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                  {resultado.filas.map((f) => (
                    <li
                      key={f.fila}
                      className={`rounded border p-2.5 text-sm ${
                        f.ok
                          ? 'border-[var(--enlace-border)] bg-[var(--enlace-surface)]'
                          : 'border-red-500/40 bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-[var(--enlace-text)]">
                            {f.nombre || <span className="text-red-400">Sin nombre</span>}
                          </p>
                          <p className="text-xs text-[var(--enlace-text-soft)]">
                            Fila {f.fila} · {f.admisiones || '?'}{' '}
                            {f.admisiones === 1 ? 'admision' : 'admisiones'}
                            {f.grupos.length > 0 && ` · ${f.grupos.join(', ')}`}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            f.ok ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {f.ok ? 'OK' : 'Problema'}
                        </span>
                      </div>
                      {!f.ok && (
                        <p className="mt-1 text-xs text-red-400">{f.problemas.join('. ')}.</p>
                      )}
                    </li>
                  ))}
                </ul>

                {errorArchivo && <p className="text-sm text-red-400">{errorArchivo}</p>}
              </div>
            )
          )}
        </div>

        {/* Pie de acciones (solo en vista previa) */}
        {fase === 'previa' && (
          <div className="flex gap-2 border-t border-[var(--enlace-border)] px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setResultado(null);
                setErrorArchivo(null);
                setFase('inicio');
              }}
              className="min-h-[44px] flex-1 rounded border border-[var(--enlace-border)] px-4 text-sm font-medium text-[var(--enlace-text)]"
            >
              Cambiar archivo
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={!puedeConfirmar}
              className="min-h-[44px] flex-1 rounded bg-enlace-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Importar {filasOk.length}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
