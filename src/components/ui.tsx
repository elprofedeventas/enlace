// ENLACE - primitivas de UI y los 3 estados obligatorios por pantalla (DoD del
// estandar): cargando / vacio / error.

import type { ReactNode } from 'react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--enlace-border)] border-t-enlace-500 ${className}`}
      aria-label="Cargando"
      role="status"
    />
  );
}

export function EstadoCarga({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--enlace-text-soft)]">
      <Spinner />
      <p className="text-sm">{texto}</p>
    </div>
  );
}

export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-base font-semibold text-[var(--enlace-text)]">{titulo}</p>
      {detalle && <p className="text-sm text-[var(--enlace-text-soft)]">{detalle}</p>}
    </div>
  );
}

export function EstadoError({
  detalle,
  onReintentar,
}: {
  detalle?: string;
  onReintentar?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-base font-semibold text-red-400">Algo salio mal</p>
      {detalle && <p className="text-sm text-[var(--enlace-text-soft)]">{detalle}</p>}
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-4 py-2 text-sm font-medium"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Boton({
  children,
  className = '',
  ...rest
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded bg-enlace-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-enlace-700 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Campo({
  label,
  id,
  className = '',
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-[var(--enlace-text-soft)]">
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2.5 text-[var(--enlace-text)] outline-none focus:border-enlace-500 ${className}`}
        {...rest}
      />
    </div>
  );
}
