import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Импортируем стили Bootstrap для использования адаптивных классов
import 'bootstrap/dist/css/bootstrap.min.css'; // Подключение Bootstrap CSS

// Импорт глобальных стилей (если есть)
import './index.css';

// Отмена регистрации всех service worker'ов, чтобы избежать использования устаревшего кэша
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

// Создаем корневой узел React и отрисовываем приложение
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);