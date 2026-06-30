// ENLACE - boton para alternar tema claro/oscuro (icono + texto).

import { useTema } from '../hooks/useTema';

export function ThemeToggle() {
  const { tema, alternar } = useTema();
  const esOscuro = tema === 'oscuro';
  return (
    <button
      type="button"
      onClick={alternar}
      className="flex items-center gap-2 rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2 text-sm font-medium text-[var(--enlace-text)]"
    >
      <span aria-hidden>{esOscuro ? '☀' : '☾'}</span>
      <span>{esOscuro ? 'Tema claro' : 'Tema oscuro'}</span>
    </button>
  );
}
