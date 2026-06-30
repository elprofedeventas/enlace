// ENLACE - inicializacion de Firebase (cliente). Unica fuente de la instancia.
// Las paginas NUNCA importan esto directo: pasan por src/services/.
// Firestore con cache local persistente. App Check protege la escritura publica
// del invitado (superficie de abuso) cuando se define VITE_RECAPTCHA_SITE_KEY.

import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// App Check (reCAPTCHA Enterprise). Asegura que solo NUESTRA app llama a
// Firebase; clave en ENLACE porque el invitado escribe sin login. Se activa al
// definir VITE_RECAPTCHA_SITE_KEY (en produccion Clase A es obligatoria).
const appCheckKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (appCheckKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export default app;
