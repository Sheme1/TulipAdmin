import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/*
  Инициализация Firebase.
  Конфигурация считывается из переменных окружения, определённых с префиксом VITE_.
  Благодаря этому подходу, можно безопасно хранить API ключи и прочие данные, а также
  обеспечить их удобное изменение без перекомпиляции приложения.
*/

// Объект конфигурации для Firebase получаем из переменных окружения
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Инициализация приложения Firebase с заданной конфигурацией
const app = initializeApp(firebaseConfig);

// Создание экземпляров Firestore и Authentication для дальнейшего использования по всему приложению
export const db = getFirestore(app);
export const auth = getAuth(app);