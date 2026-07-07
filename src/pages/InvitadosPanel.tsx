// ENLACE - panel de INVITADOS Y LLAVES (/eventos/:slug/invitados, ENLACE-2).
// El llavero de la boda: modo de acceso, catalogo de grupos, y por invitado:
// admisiones, grupos, y su llave (copiar link, WhatsApp, QR, regenerar,
// revocar). En ENLACE-3 esta pantalla pasa a manos de los novios.

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Copy,
  KeyRound,
  MessageCircle,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { getEvento, setGrupos, setModoAcceso } from '../services/eventos';
import {
  actualizarInvitado,
  crearInvitado,
  eliminarInvitado,
  escucharInvitados,
  linkDeInvitado,
  linkWhatsApp,
  regenerarLlave,
  revocarLlave,
} from '../services/invitados';
import { EstadoCarga, EstadoError, EstadoVacio } from '../components/ui';
import type { Evento, Invitado } from '../types';

export function InvitadosPanel() {
  const { slug = '' } = useParams();
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [invitados, setInvitados] = useState<Invitado[] | null>(null);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Alta rapida
  const [nombre, setNombre] = useState('');
  const [admisiones, setAdmisiones] = useState(2);
  const [gruposNuevo, setGruposNuevo] = useState<string[]>([]);
  const [nuevoGrupo, setNuevoGrupo] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    getEvento(slug)
      .then(setEvento)
      .catch(() => setError(true));
    const off = escucharInvitados(slug, setInvitados, () => setError(true));
    return off;
  }, [slug]);

  function avisar(texto: string) {
    setAviso(texto);
    window.setTimeout(() => setAviso(null), 2500);
  }

  if (error) return <EstadoError detalle="No pudimos cargar los invitados." />;
  if (evento === undefined || invitados === null) return <EstadoCarga />;
  if (evento === null) return <EstadoVacio titulo="Boda no encontrada" />;

  const grupos = evento.grupos ?? [];
  const modo = evento.acceso.modo;

  async function crear() {
    if (nombre.trim().length < 2) return;
    setCreando(true);
    try {
      await crearInvitado(slug, { nombre, admisiones, grupos: gruposNuevo });
      setNombre('');
      setAdmisiones(2);
      setGruposNuevo([]);
    } finally {
      setCreando(false);
    }
  }

  async function agregarGrupo() {
    const g = nuevoGrupo.trim();
    if (!g || grupos.includes(g)) return;
    const nuevos = [...grupos, g];
    await setGrupos(slug, nuevos);
    setEvento({ ...evento!, grupos: nuevos });
    setNuevoGrupo('');
  }

  async function copiarLink(inv: Invitado) {
    await navigator.clipboard.writeText(linkDeInvitado(slug, inv.token));
    avisar(`Link de ${inv.nombre} copiado`);
  }

  async function descargarQr(inv: Invitado) {
    const url = await QRCode.toDataURL(linkDeInvitado(slug, inv.token), {
      width: 640,
      margin: 2,
    });
    const a = document.createElement('a');
    a.href = url;
    a.download = `llave-${inv.nombre.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.click();
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-6">
      <p className="text-xs text-[var(--enlace-text-soft)]">
        <Link to={`/eventos/${slug}`} className="underline">
          ← {evento.novios.personaA} & {evento.novios.personaB}
        </Link>
      </p>
      <h1 className="mt-1 font-serif text-3xl text-[var(--enlace-text)]">Invitados y llaves</h1>

      {/* Modo de acceso */}
      <section className="mt-5 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface)] p-4">
        <p className="text-sm font-medium text-[var(--enlace-text)]">Modo de acceso</p>
        <p className="mt-0.5 text-xs text-[var(--enlace-text-soft)]">
          {modo === 'tokenUnico'
            ? 'Por llave: solo entra quien tiene su link personal.'
            : 'Abierto: cualquiera con el link general puede ver y confirmar.'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <BotonModo
            activo={modo === 'publico'}
            onClick={async () => {
              await setModoAcceso(slug, 'publico');
              setEvento({ ...evento, acceso: { modo: 'publico' } });
            }}
          >
            Abierto
          </BotonModo>
          <BotonModo
            activo={modo === 'tokenUnico'}
            onClick={async () => {
              await setModoAcceso(slug, 'tokenUnico');
              setEvento({ ...evento, acceso: { modo: 'tokenUnico' } });
            }}
          >
            Por llave
          </BotonModo>
        </div>
      </section>

      {/* Grupos de acceso */}
      <section className="mt-4 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface)] p-4">
        <p className="text-sm font-medium text-[var(--enlace-text)]">Grupos de acceso</p>
        <p className="mt-0.5 text-xs text-[var(--enlace-text-soft)]">
          Las zonas de la boda: los momentos con visibilidad "por grupos" solo los ven
          los invitados de esos grupos (p. ej. Bridal Shower).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {grupos.map((g) => (
            <span
              key={g}
              className="rounded-full border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-1 text-xs text-[var(--enlace-text)]"
            >
              {g}
            </span>
          ))}
          {grupos.length === 0 && (
            <span className="text-xs text-[var(--enlace-text-soft)]">Aún no hay grupos.</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={nuevoGrupo}
            onChange={(e) => setNuevoGrupo(e.target.value)}
            placeholder="Nuevo grupo (p. ej. Bridal Shower)"
            maxLength={40}
            className="min-h-[44px] flex-1 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 text-sm text-[var(--enlace-text)] outline-none focus:border-enlace-500"
          />
          <button
            type="button"
            onClick={agregarGrupo}
            className="rounded bg-enlace-700 px-4 text-sm font-semibold text-white"
          >
            Agregar
          </button>
        </div>
      </section>

      {/* Alta de invitado */}
      <section className="mt-4 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface)] p-4">
        <p className="text-sm font-medium text-[var(--enlace-text)]">Nuevo invitado</p>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del invitado"
            maxLength={120}
            className="min-h-[44px] rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 text-sm text-[var(--enlace-text)] outline-none focus:border-enlace-500"
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--enlace-text-soft)]">
              Admisiones (personas en total)
            </span>
            <div className="flex items-center gap-2">
              <BotonMini onClick={() => setAdmisiones((n) => Math.max(1, n - 1))}>−</BotonMini>
              <span className="w-6 text-center font-medium text-[var(--enlace-text)]">
                {admisiones}
              </span>
              <BotonMini onClick={() => setAdmisiones((n) => Math.min(21, n + 1))}>+</BotonMini>
            </div>
          </div>
          {grupos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {grupos.map((g) => (
                <ChipGrupo
                  key={g}
                  activo={gruposNuevo.includes(g)}
                  onClick={() =>
                    setGruposNuevo((gs) =>
                      gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g],
                    )
                  }
                >
                  {g}
                </ChipGrupo>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={crear}
            disabled={creando || nombre.trim().length < 2}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded bg-enlace-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus size={16} aria-hidden="true" /> Crear invitado con su llave
          </button>
        </div>
      </section>

      {/* Lista */}
      <section className="mt-5">
        <p className="mb-2 text-sm font-medium text-[var(--enlace-text)]">
          Lista ({invitados.length})
        </p>
        {invitados.length === 0 && (
          <EstadoVacio
            titulo="Aún no hay invitados"
            detalle="Crea el primero y comparte su llave por WhatsApp o QR."
          />
        )}
        <ul className="flex flex-col gap-3">
          {invitados.map((inv) => (
            <li
              key={inv.invitadoId}
              className="rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface)] p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--enlace-text)]">{inv.nombre}</p>
                  <p className="text-xs text-[var(--enlace-text-soft)]">
                    {inv.admisiones} {inv.admisiones === 1 ? 'admisión' : 'admisiones'}
                    {inv.grupos.length > 0 && ` · ${inv.grupos.join(', ')}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    inv.estado === 'activo'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {inv.estado === 'activo' ? 'Llave activa' : 'Revocada'}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <BotonAccion onClick={() => copiarLink(inv)} icono={<Copy size={14} />}>
                  Copiar link
                </BotonAccion>
                <a
                  href={linkWhatsApp(
                    inv.nombre,
                    evento.novios.personaA,
                    evento.novios.personaB,
                    linkDeInvitado(slug, inv.token),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[36px] items-center gap-1.5 rounded border border-[var(--enlace-border)] px-3 text-xs font-medium text-[var(--enlace-text)]"
                >
                  <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                </a>
                <BotonAccion onClick={() => descargarQr(inv)} icono={<QrCode size={14} />}>
                  QR
                </BotonAccion>
                {inv.estado === 'activo' ? (
                  <BotonAccion
                    onClick={async () => {
                      await revocarLlave(slug, inv.invitadoId);
                      avisar(`Llave de ${inv.nombre} revocada`);
                    }}
                    icono={<KeyRound size={14} />}
                  >
                    Revocar
                  </BotonAccion>
                ) : (
                  <BotonAccion
                    onClick={async () => {
                      await regenerarLlave(slug, inv.invitadoId);
                      avisar(`Nueva llave para ${inv.nombre}`);
                    }}
                    icono={<RotateCcw size={14} />}
                  >
                    Nueva llave
                  </BotonAccion>
                )}
                <BotonAccion
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar a ${inv.nombre} y su llave?`)) {
                      await eliminarInvitado(slug, inv.invitadoId);
                    }
                  }}
                  icono={<Trash2 size={14} />}
                >
                  Eliminar
                </BotonAccion>
              </div>

              {/* Ajuste rapido de admisiones */}
              <div className="mt-3 flex items-center justify-between border-t border-[var(--enlace-border)] pt-2">
                <span className="text-xs text-[var(--enlace-text-soft)]">Admisiones</span>
                <div className="flex items-center gap-2">
                  <BotonMini
                    onClick={() =>
                      actualizarInvitado(slug, inv.invitadoId, {
                        admisiones: Math.max(1, inv.admisiones - 1),
                      })
                    }
                  >
                    −
                  </BotonMini>
                  <span className="w-5 text-center text-sm text-[var(--enlace-text)]">
                    {inv.admisiones}
                  </span>
                  <BotonMini
                    onClick={() =>
                      actualizarInvitado(slug, inv.invitadoId, {
                        admisiones: Math.min(21, inv.admisiones + 1),
                      })
                    }
                  >
                    +
                  </BotonMini>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {aviso && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded bg-[var(--enlace-surface-2)] px-4 py-2 text-sm text-[var(--enlace-text)] shadow-lg">
          {aviso}
        </div>
      )}
    </div>
  );
}

function BotonModo({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded border px-3 text-sm font-medium transition-colors ${
        activo
          ? 'border-enlace-500 bg-enlace-500/15 text-[var(--enlace-text)]'
          : 'border-[var(--enlace-border)] text-[var(--enlace-text-soft)]'
      }`}
    >
      {children}
    </button>
  );
}

function ChipGrupo({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        activo
          ? 'border-enlace-500 bg-enlace-500/15 text-[var(--enlace-text)]'
          : 'border-[var(--enlace-border)] text-[var(--enlace-text-soft)]'
      }`}
    >
      {children}
    </button>
  );
}

function BotonMini({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--enlace-border)] text-[var(--enlace-text)]"
    >
      {children}
    </button>
  );
}

function BotonAccion({
  onClick,
  icono,
  children,
}: {
  onClick: () => void;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[36px] items-center gap-1.5 rounded border border-[var(--enlace-border)] px-3 text-xs font-medium text-[var(--enlace-text)]"
    >
      {icono} {children}
    </button>
  );
}
