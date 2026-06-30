import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Aplica el tema guardado antes de pintar (evita parpadeo). Oscuro por defecto.
const temaGuardado = localStorage.getItem('enlace_tema');
document.documentElement.setAttribute('data-theme', temaGuardado === 'claro' ? 'claro' : 'oscuro');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
