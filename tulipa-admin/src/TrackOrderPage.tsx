import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase.config";
import { Order } from "./OrderForm";

const TrackOrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const docRef = doc(db, "orders", orderId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
          } else {
            setError("Заказ не найден");
          }
        } catch (err) {
          console.error("Ошибка при загрузке заказа:", err);
          setError("Ошибка при загрузке заказа");
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  const markAsCompleted = async () => {
    if (!order || order.status === "Выполнен") return;
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", orderId!);
      await updateDoc(orderRef, { status: "Выполнен" });
      setOrder({ ...order, status: "Выполнен" });
      alert("Заказ отмечен как выполненный");
    } catch (err) {
      console.error("Ошибка при обновлении заказа:", err);
      setError("Ошибка при обновлении заказа");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="container mt-5">Загрузка заказа...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;
  if (!order) return null;

  return (
    <div className="container mt-5">
      <h2>Отслеживание заказа</h2>
      <div className="card p-4">
        <h4>Детали заказа</h4>
        <p><strong>Номер заказа:</strong> {order.orderNumber}</p>
        <p><strong>Клиент:</strong> {order.customer}</p>
        <p><strong>Цена заказа:</strong> {order.price}</p>
        <p><strong>Сорт:</strong> {order.sort}</p>
        <p><strong>Количество цветов:</strong> {order.flowerQuantity}</p>
        <p><strong>Упаковка:</strong> {order.packaging}</p>
        <p><strong>Адрес доставки:</strong> {order.deliveryAddress || "Не указан"}</p>
        <p><strong>Время доставки:</strong> {order.deliveryTime || "Не указано"}</p>
        <p><strong>Доставка:</strong> {order.delivery}</p>
        <p><strong>Статус заказа:</strong> {order.status}</p>
        <p><strong>Кто создал заказ:</strong> {order.createdBy}</p>
      </div>
      {order.status !== "Выполнен" && (
        <button
          className="btn btn-success mt-3"
          onClick={markAsCompleted}
          disabled={updating}
        >
          {updating ? "Обновление..." : "Заказ выполнен"}
        </button>
      )}
      <button
        className="btn btn-secondary mt-3 ms-2"
        onClick={() => {
          // Если в истории больше одной записи, возвращаемся назад,
          // иначе перенаправляем на главную страницу
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      >
        Назад
      </button>
    </div>
  );
};

export default TrackOrderPage;
