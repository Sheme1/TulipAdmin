import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import OrdersPage from "./OrdersPage";
import PrivateRoute from "./PrivateRoute";
import TrackOrderPage from "./TrackOrderPage";
import './App.css'

/*
  Компонент App отвечает за настройку маршрутизации в приложении.
  Он определяет редирект неаутентифицированных пользователей на страницу LoginPage,
  а аутентифицированные пользователи могут получить доступ к странице OrdersPage.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <OrdersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/track/:orderId"
          element={
            <PrivateRoute>
              <TrackOrderPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
