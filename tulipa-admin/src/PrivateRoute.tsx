import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "./firebase.config";

/*
  Компонент PrivateRoute проверяет, аутентифицирован ли пользователь.
  Если пользователь не аутентифицирован, происходит редирект на страницу входа.
  В противном случае, выводится защищённое содержимое.
*/
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!auth.currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute;