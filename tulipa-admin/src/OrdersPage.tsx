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
  total: number;
  status: string;
}

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));
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
    <div className="container mt-5">
      <Header />
      <h2>Заказы тюльпанов</h2>
      {orders.length === 0 ? (
        <p>Нет заказов</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Клиент</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>{order.customer}</td>
                <td>{order.total}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <OrderForm />
    </div>
  );
};

export default OrdersPage;