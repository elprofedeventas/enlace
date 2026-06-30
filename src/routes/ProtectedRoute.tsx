// ENLACE - guarda de rutas del panel. Exige sesion + claim de operador.
// Fail-closed. La seguridad real la dan las reglas; esto es UX. En v0 el panel
// es SOLO del operador (el listado de bodas exige operador en reglas); el panel
// de novios (claim `eventos`) llega en roadmap #1.

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EstadoCarga } from '../components/ui';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, claims, loading } = useAuth();

  if (loading) return <EstadoCarga texto="Entrando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!claims || !claims.operador) return <Navigate to="/sin-acceso" replace />;
  return <>{children}</>;
}
