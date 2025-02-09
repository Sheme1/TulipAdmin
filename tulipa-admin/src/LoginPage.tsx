import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase.config";
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Перенаправляем на защищённую страницу заказов после успешного входа
      navigate("/", { replace: true });
    } catch (err: unknown) {
      // Проверяем, является ли ошибка экземпляром Error, чтобы корректно получить сообщение
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ошибка входа");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container login-window mt-5">
      <h2>Вход в систему</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Пароль
          </label>
          <input
            type="password"
            id="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;