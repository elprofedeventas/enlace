// ENLACE - ornamentos de la invitacion: el monograma-sello (la firma visual de
// cada boda, como el sello de lacre de la papeleria fina), el separador de
// secciones y el reveal suave al hacer scroll.

import { useEffect, useRef, useState, type ReactNode } from 'react';

// ---- Monograma-sello: iniciales en serif dentro de un doble anillo fino ----
export function Monograma({
  a,
  b,
  size = 92,
}: {
  a: string;
  b: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Monograma ${a} y ${b}`}
      className="inv-monograma"
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke="var(--boda-linea)" strokeWidth="1" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--boda-linea)" strokeWidth="0.5" />
      <text
        x="34"
        y="56"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="34"
        fontStyle="italic"
        fill="var(--boda-tinta)"
      >
        {a}
      </text>
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="20"
        fontStyle="italic"
        fill="var(--boda-acento)"
      >
        &amp;
      </text>
      <text
        x="66"
        y="56"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="34"
        fontStyle="italic"
        fill="var(--boda-tinta)"
      >
        {b}
      </text>
    </svg>
  );
}

// ---- Separador: hairline con un rombo al centro (guiño a papeleria fina) ----
export function Separador() {
  return (
    <div className="my-10 flex items-center justify-center gap-3" aria-hidden="true">
      <span className="h-px w-16 bg-[var(--boda-linea)]" />
      <span
        className="h-1.5 w-1.5 rotate-45"
        style={{ backgroundColor: 'var(--boda-acento)' }}
      />
      <span className="h-px w-16 bg-[var(--boda-linea)]" />
    </div>
  );
}

// ---- Reveal: entrada suave al entrar en el viewport (IntersectionObserver).
// Respeta prefers-reduced-motion (la clase CSS lo maneja). ----
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`inv-reveal ${visible ? 'inv-reveal-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

// ---- Confeti sutil para el "Gracias" del RSVP. Solo CSS, una sola pasada. ----
export function Confeti() {
  const piezas = Array.from({ length: 22 });
  return (
    <div className="inv-confeti" aria-hidden="true">
      {piezas.map((_, i) => (
        <span
          key={i}
          className="inv-confeti-pieza"
          style={{
            left: `${(i * 100) / piezas.length + (i % 3)}%`,
            animationDelay: `${(i % 7) * 0.18}s`,
            animationDuration: `${2.4 + (i % 5) * 0.35}s`,
            backgroundColor: i % 3 === 0 ? 'var(--boda-acento)' : 'var(--boda-linea)',
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
