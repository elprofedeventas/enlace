// ENLACE - crear una boda (v0: se crea ya publicada para verla en su slug).
// Estados de carga/error cubiertos. Edicion fina + estados = roadmap.

import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearEvento, normalizarSlug, type NuevoEvento } from '../services/eventos';
import { useAuth } from '../contexts/AuthContext';
import { Boton, Campo } from '../components/ui';
import { MAX_ACOMPANANTES } from '../config';

export function EventoEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [personaA, setPersonaA] = useState('');
  const [personaB, setPersonaB] = useState('');
  const [slugManual, setSlugManual] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugarNombre, setLugarNombre] = useState('');
  const [lugarDireccion, setLugarDireccion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [maxAcomp, setMaxAcomp] = useState('2');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Slug sugerido a partir de los nombres; el operador puede sobreescribirlo.
  const slugAuto = useMemo(
    () => normalizarSlug(`${personaA}-y-${personaB}`),
    [personaA, personaB],
  );
  const slug = slugManual ? normalizarSlug(slugManual) : slugAuto;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (slug.length < 3) {
      setError('El enlace de la boda (slug) debe tener al menos 3 caracteres.');
      return;
    }
    const max = Math.max(0, Math.min(MAX_ACOMPANANTES, parseInt(maxAcomp, 10) || 0));

    const input: NuevoEvento = {
      slug,
      personaA,
      personaB,
      fecha,
      lugarNombre,
      lugarDireccion: lugarDireccion || undefined,
      mensajeInvitacion: mensaje,
      maxAcompanantesDefault: max,
    };

    setCargando(true);
    try {
      const id = await crearEvento(input, user.uid);
      navigate(`/eventos/${id}`, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.message === 'slug_en_uso') {
        setError('Ese enlace ya esta en uso. Elige otro.');
      } else {
        setError('No pudimos crear la boda. Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <h1 className="text-lg font-bold text-[var(--enlace-text)]">Nueva boda</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Nombre 1"
            id="personaA"
            value={personaA}
            onChange={(e) => setPersonaA(e.target.value)}
            required
          />
          <Campo
            label="Nombre 2"
            id="personaB"
            value={personaB}
            onChange={(e) => setPersonaB(e.target.value)}
            required
          />
        </div>

        <Campo
          label="Enlace de la boda (slug)"
          id="slug"
          value={slug}
          onChange={(e) => setSlugManual(e.target.value)}
          placeholder="maria-y-juan"
        />
        <p className="-mt-2 text-xs text-[var(--enlace-text-soft)]">
          La invitacion vivira en /b/{slug || '...'}
        </p>

        <Campo
          label="Fecha"
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <Campo
          label="Lugar"
          id="lugar"
          value={lugarNombre}
          onChange={(e) => setLugarNombre(e.target.value)}
          required
        />
        <Campo
          label="Direccion (opcional)"
          id="direccion"
          value={lugarDireccion}
          onChange={(e) => setLugarDireccion(e.target.value)}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="mensaje" className="text-sm font-medium text-[var(--enlace-text-soft)]">
            Mensaje de la invitacion
          </label>
          <textarea
            id="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            maxLength={2000}
            required
            className="w-full rounded border border-[var(--enlace-border)] bg-[var(--enlace-surface-2)] px-3 py-2.5 text-[var(--enlace-text)] outline-none focus:border-enlace-500"
          />
        </div>

        <Campo
          label="Acompanantes permitidos por invitado"
          id="maxAcomp"
          type="number"
          min={0}
          max={MAX_ACOMPANANTES}
          value={maxAcomp}
          onChange={(e) => setMaxAcomp(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Boton type="submit" disabled={cargando}>
          {cargando ? 'Creando...' : 'Crear y publicar'}
        </Boton>
      </form>
    </div>
  );
}
