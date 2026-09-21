import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Cloud Storage não é usado: o Firebase passou a exigir o plano pago (Blaze)
// até para uso dentro da cota gratuita. A foto da nota fiscal é comprimida no
// navegador e guardada como base64 direto no Firestore (veja src/lib/image.js
// e src/lib/inscricoes.js) para manter o projeto 100% no plano gratuito.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
