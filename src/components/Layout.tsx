// ENLACE - shell del panel (estandar Nueva Orbita): topbar (nombre + Mi cuenta) +
// bottom nav con FAB central "+ Nueva boda". "Mi cuenta" NO ocupa tab (vive en la
// topbar). En v0 el panel es del operador.

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { APP_NOMBRE } from '../config';

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col bg-[var(--enlace-bg)]">
      {/* Topbar */}
      <header className="safe-top sticky top-0 z-20 flex items-center justify-between border-b border-[var(--enlace-border)] bg-[var(--enlace-surface)] px-4 py-3">
        <span className="text-lg font-bold tracking-tight text-[var(--enlace-text)]">
          {APP_NOMBRE}
        </span>
        <NavLink
          to="/cuenta"
          className="flex items-center gap-1 text-xs font-medium text-[var(--enlace-text-soft)]"
          aria-label="Mi cuenta"
        >
          <span aria-hidden className="text-base leading-none">
            ●
          </span>
          Mi cuenta
        </NavLink>
      </header>

      {/* Contenido */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav + FAB Nueva boda */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-xl items-end justify-around border-t border-[var(--enlace-border)] bg-[var(--enlace-surface)] px-2 pt-1.5">
        <TabLink to="/" label="Bodas" icon="◈" />

        <button
          type="button"
          onClick={() => navigate('/eventos/nuevo')}
          className="-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-enlace-600 text-white shadow-lg shadow-enlace-900/40"
          aria-label="Nueva boda"
        >
          <span className="text-2xl leading-none">+</span>
        </button>

        <TabLink to="/cuenta" label="Mi cuenta" icon="●" />
      </nav>
    </div>
  );
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex w-16 flex-col items-center gap-0.5 rounded px-1 py-1.5 text-[10px] font-medium ${
          isActive ? 'text-enlace-500' : 'text-[var(--enlace-text-soft)]'
        }`
      }
    >
      <span aria-hidden className="text-base leading-none">
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}
