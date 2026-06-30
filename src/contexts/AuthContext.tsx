// ENLACE - contexto global de autenticacion + claims (operador / eventos).
// Expone el usuario Firebase y sus claims (leidos del token, nunca del cliente).
// No importa firebase/* directo: pasa por services/auth.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, leerClaims, logout as logoutService } from '../services/auth';
import type { Claims } from '../types';

interface AuthValue {
  user: FirebaseUser | null; // sesion Auth
  claims: Claims | null; // operador + eventos (custom claims)
  loading: boolean; // resolviendo sesion + claims inicial
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (fbUser) => {
      if (!active) return;
      setUser(fbUser);
      setClaims(fbUser ? await leerClaims(fbUser) : null);
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  async function logout(): Promise<void> {
    await logoutService();
    setUser(null);
    setClaims(null);
  }

  const value: AuthValue = { user, claims, loading, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
