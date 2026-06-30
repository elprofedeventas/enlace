// ENLACE - sesion valida pero sin claim de acceso al panel (ni operador ni
// owner). En v0 el panel es del operador; los novios llegan con roadmap #1.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Boton } from '../components/ui';

export function SinAcceso() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function salir() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className="text-xl font-bold text-[var(--enlace-text)]">Tu cuenta aun no tiene acceso</h1>
      <p className="text-sm text-[var(--enlace-text-soft)]">
        Esta cuenta no esta habilitada para administrar bodas. Si crees que es un error, contacta a
        la operadora.
      </p>
      <Boton onClick={salir}>Cerrar sesion</Boton>
    </div>
  );
}
