import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "./firebase.config";
import { onAuthStateChanged } from "firebase/auth";

/*
  Компонент PrivateRoute проверяет, аутентифицирован ли пользователь.
  Если пользователь не аутентифицирован, происходит редирект на страницу входа.
  В противном случае, выводится защищённое содержимое.
*/
interface PrivateRouteProps {
  children: React.ReactNode;
}

// Обновлённый компонент PrivateRoute для предотвращения автоматического выхода при перезагрузке страницы.
// Он использует слушатель onAuthStateChanged, чтобы дождаться восстановления состояния аутентификации.
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Состояние загрузки, которое указывает, что Firebase восстанавливает состояние аутентификации.
  const [loading, setLoading] = useState(true);
  // Состояние аутентификации: true, если пользователь существует, иначе false.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Подписываемся на изменения состояния аутентификации.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Если пользователь найден, то приводим значение к true, иначе false.
      setIsAuthenticated(!!user);
      // После получения состояния аутентификации убираем индикатор загрузки.
      setLoading(false);
    });
    // Отписываемся при размонтировании компонента, чтобы избежать утечек памяти.
    return unsubscribe;
  }, []);

  // Пока происходит восстановление состояния аутентификации, отображаем сообщение о загрузке.
  if (loading) return <div>Загрузка...</div>;

  // Если пользователь не авторизован, перенаправляем его на страницу входа.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь авторизован, отображаем защищённое содержимое.
  return <>{children}</>;
};

export default PrivateRoute;