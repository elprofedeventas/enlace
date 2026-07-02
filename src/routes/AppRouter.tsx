// ENLACE - mapa de rutas. Tres superficies en una sola SPA:
//  - publica: /login, /privacidad, /b/:slug (la invitacion del invitado)
//  - panel protegido (Layout): /, /eventos/nuevo, /eventos/:slug, /cuenta

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Panel } from '../pages/Panel';
import { EventoEditor } from '../pages/EventoEditor';
import { EventoDetalle } from '../pages/EventoDetalle';
import { MomentosEditor } from '../pages/MomentosEditor';
import { Invitacion } from '../pages/Invitacion';
import { Cuenta } from '../pages/Cuenta';
import { SinAcceso } from '../pages/SinAcceso';
import { PoliticaPrivacidad } from '../components/PoliticaPrivacidad';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/sin-acceso" element={<SinAcceso />} />
        <Route path="/b/:slug" element={<Invitacion />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Panel />} />
          <Route path="eventos/nuevo" element={<EventoEditor />} />
          <Route path="eventos/:slug" element={<EventoDetalle />} />
          <Route path="eventos/:slug/momentos" element={<MomentosEditor />} />
          <Route path="cuenta" element={<Cuenta />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
