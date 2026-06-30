// ENLACE - tema claro/oscuro. Oscuro por defecto (estandar Nueva Orbita).
// El atributo data-theme en <html> manda; Tailwind usa darkMode selector.

import { useCallback, useEffect, useState } from 'react';

type Tema = 'oscuro' | 'claro';
const CLAVE = 'enlace_tema';

function temaGuardado(): Tema {
  const t = localStorage.getItem(CLAVE);
  return t === 'claro' ? 'claro' : 'oscuro';
}

function aplicar(tema: Tema): void {
  document.documentElement.setAttribute('data-theme', tema);
}

export function useTema(): { tema: Tema; alternar: () => void } {
  const [tema, setTema] = useState<Tema>(temaGuardado);

  useEffect(() => {
    aplicar(tema);
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  }, []);

  return { tema, alternar };
}
