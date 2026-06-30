import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ENLACE - configuracion Vite. El skeleton v0 NO lleva PWA a proposito: la
// invitacion publica es un one-pager y un service worker arriesgaria servir una
// version vieja el dia del evento (estandar Bloque 5). La PWA del panel entra
// como feature posterior.
export default defineConfig({
  plugins: [react()],
});
