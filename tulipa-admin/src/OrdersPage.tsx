import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "./firebase.config";
import OrderForm from "./OrderForm";
import Header from "./Header";

/*
  Компонент OrdersPage является основной страницей для управления заказами.
  Здесь будет отображаться список заказов и реализован функционал добавления нового заказа.
*/

interface Order {
  id: string;
  customer: string;
  price: number;
  sort: string;
  flowerQuantity: number;
  packaging: "Да" | "Нет";
  deliveryAddress: string;
  deliveryTime: string;
  delivery: "Да" | "Нет";
  status: "Новый" | "Выполняется" | "Выполнен";
  createdBy: "Сервис" | "Пользователь";
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"add" | "list">("add");

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...(doc.data() as Omit<Order, "id">),
          })
        );
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error("Ошибка загрузки заказов: ", err);
        setError("Ошибка загрузки заказов");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="container mt-5">Загрузка заказов...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  return (
    <div className="container working-window mt-5">
      <Header />
      <h2 className="mb-4">Управление заказами тюльпанов</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "add" ? "active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            Добавление заказа
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            Список заказов
          </button>
        </li>
      </ul>

      {activeTab === "add" && (
        <section>
          <OrderForm />
        </section>
      )}

      {activeTab === "list" && (
        <section>
          {orders.length === 0 ? (
            <p>Нет заказов</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Клиент</th>
                  <th>Цена заказа</th>
                  <th>Сорт</th>
                  <th>Кол-во цветов</th>
                  <th>Упаковка</th>
                  <th>Адрес доставки</th>
                  <th>Время доставки</th>
                  <th>Доставка</th>
                  <th>Статус заказа</th>
                  <th>Кто создал заказ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id}>
                    <td>{index + 1}</td>
                    <td>{order.customer}</td>
                    <td>{order.price}</td>
                    <td>{order.sort}</td>
                    <td>{order.flowerQuantity}</td>
                    <td>{order.packaging}</td>
                    <td>{order.deliveryAddress}</td>
                    <td>{order.deliveryTime}</td>
                    <td>{order.delivery}</td>
                    <td>{order.status}</td>
                    <td>{order.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
};

export default OrdersPage;