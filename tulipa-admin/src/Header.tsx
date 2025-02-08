import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.config";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  return (
    <header className="d-flex justify-content-between align-items-center p-3 bg-light mb-4">
      <h1 className="h4 m-0">Управление заказами</h1>
      <button className="btn btn-outline-danger" onClick={handleLogout}>
        Выйти
      </button>
    </header>
  );
};

export default Header;