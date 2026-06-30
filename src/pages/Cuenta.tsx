// ENLACE - "Mi cuenta" (estructura estandar Nueva Orbita, reducida para v0):
// toggle de tema, mis datos, cerrar sesion y enlace a la Politica de Privacidad.

import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Boton, Card } from '../components/ui';

export function Cuenta() {
  const { user, claims, logout } = useAuth();
  const navigate = useNavigate();

  async function salir() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <h1 className="text-lg font-bold text-[var(--enlace-text)]">Mi cuenta</h1>

      <ThemeToggle />

      <Card>
        <p className="text-sm font-semibold text-[var(--enlace-text)]">Mis datos</p>
        <p className="mt-1 text-sm text-[var(--enlace-text-soft)]">{user?.email}</p>
        <p className="mt-1 text-xs text-[var(--enlace-text-soft)]">
          {claims?.operador ? 'Operador' : 'Novios'}
        </p>
      </Card>

      <Boton onClick={salir}>Cerrar sesion</Boton>

      <Link
        to="/privacidad"
        className="mt-2 text-center text-xs text-[var(--enlace-text-soft)] hover:text-[var(--enlace-text)]"
      >
        Politica de Privacidad
      </Link>
    </div>
  );
}
