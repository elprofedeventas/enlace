// ENLACE - campo de contrasena con ver/ocultar (estandar Nueva Orbita).

import { useState, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function CampoPass({ label, id, className = '', ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? 'pass';
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--enlace-text-soft)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={`w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2.5 pr-16 text-[var(--enlace-text)] outline-none focus:border-enlace-500 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-[var(--enlace-text-soft)] hover:text-[var(--enlace-text)]"
          aria-label={visible ? 'Ocultar contrasena' : 'Ver contrasena'}
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </div>
  );
}
