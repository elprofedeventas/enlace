// ENLACE - inicio de sesion del panel (operador / novios). Email + contrasena.

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { entrar, recuperarPassword } from '../services/auth';
import { CampoPass } from '../components/CampoPass';
import { Boton, Campo } from '../components/ui';
import { APP_NOMBRE, APP_TAGLINE } from '../config';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setCargando(true);
    try {
      await entrar(email, password);
      navigate('/', { replace: true });
    } catch {
      setError('No pudimos iniciar sesion. Revisa tu correo y contrasena.');
    } finally {
      setCargando(false);
    }
  }

  async function onRecuperar() {
    setError(null);
    setAviso(null);
    if (!email.trim()) {
      setError('Escribe tu correo para enviarte el enlace de recuperacion.');
      return;
    }
    try {
      await recuperarPassword(email);
      setAviso('Te enviamos un correo para restablecer tu contrasena.');
    } catch {
      setError('No pudimos enviar el correo de recuperacion.');
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-[var(--enlace-text)]">{APP_NOMBRE}</h1>
        <p className="mt-1 text-sm text-[var(--enlace-text-soft)]">{APP_TAGLINE}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Campo
          label="Correo"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <CampoPass
          label="Contrasena"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-red-400">{error}</p>}
        {aviso && <p className="text-sm text-enlace-400">{aviso}</p>}

        <Boton type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </Boton>
      </form>

      <button
        type="button"
        onClick={onRecuperar}
        className="text-center text-sm text-[var(--enlace-text-soft)] hover:text-[var(--enlace-text)]"
      >
        Olvide mi contrasena
      </button>
    </div>
  );
}
