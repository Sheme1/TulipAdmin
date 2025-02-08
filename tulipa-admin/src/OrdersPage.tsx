import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  DocumentData,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase.config";
import OrderForm from "./OrderForm";
import Header from "./Header";

/*
  Компонент OrdersPage является основной страницей для управления заказами.
  Здесь отображается список заказов с возможностью добавления, редактирования и удаления заказа.
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

  // Состояние для редактируемого заказа (если null – ни один заказ не редактируется)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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

  // Функция для удаления заказа по его id
  const handleDelete = async (orderId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить заказ?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (err) {
        console.error("Ошибка удаления заказа: ", err);
      }
    }
  };

  // Функция для сохранения изменений редактируемого заказа
  const handleSave = async () => {
    if (editingOrder) {
      try {
        // Получаем ссылку на документ и исключаем поле id из объекта данных
        const orderRef = doc(db, "orders", editingOrder.id);
        const { id, ...orderData } = editingOrder;
        await updateDoc(orderRef, orderData);
        setEditingOrder(null);
      } catch (err) {
        console.error("Ошибка обновления заказа: ", err);
      }
    }
  };

  if (loading) return <div className="container mt-5">Загрузка заказов...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  // Опции для поля "Сорт"
  const sortOptions = [
    "Andre Citroen",
    "Circuit",
    "First star",
    "Laptop",
    "White Master",
    "Triple A",
    "Supemodel",
    "Tresor",
    "Strong Love",
    "Strong Gold",
    "Respectable",
    "Montezuma",
    "Columbus",
    "Valdivia",
  ];

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
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  // Если заказ находится в режиме редактирования, отображаем инпуты для изменения его данных
                  if (editingOrder && editingOrder.id === order.id) {
                    return (
                      <tr key={order.id}>
                        <td>{index + 1}</td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editingOrder.customer}
                            onChange={(e) =>
                              setEditingOrder({ ...editingOrder, customer: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={editingOrder.price}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                price: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingOrder.sort}
                            onChange={(e) =>
                              setEditingOrder({ ...editingOrder, sort: e.target.value })
                            }
                          >
                            {sortOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={editingOrder.flowerQuantity}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                flowerQuantity: Number(e.target.value),
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingOrder.packaging}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                packaging: e.target.value as "Да" | "Нет",
                              })
                            }
                          >
                            <option value="Да">Да</option>
                            <option value="Нет">Нет</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editingOrder.deliveryAddress}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                deliveryAddress: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            className="form-control"
                            value={editingOrder.deliveryTime}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                deliveryTime: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingOrder.delivery}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                delivery: e.target.value as "Да" | "Нет",
                              })
                            }
                          >
                            <option value="Да">Да</option>
                            <option value="Нет">Нет</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingOrder.status}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                status: e.target.value as "Новый" | "Выполняется" | "Выполнен",
                              })
                            }
                          >
                            <option value="Новый">Новый</option>
                            <option value="Выполняется">Выполняется</option>
                            <option value="Выполнен">Выполнен</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingOrder.createdBy}
                            onChange={(e) =>
                              setEditingOrder({
                                ...editingOrder,
                                createdBy: e.target.value as "Сервис" | "Пользователь",
                              })
                            }
                          >
                            <option value="Сервис">Сервис</option>
                            <option value="Пользователь">Пользователь</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-success me-2" onClick={handleSave}>
                            Сохранить
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setEditingOrder(null)}
                          >
                            Отмена
                          </button>
                        </td>
                      </tr>
                    );
                  } else {
                    // Отображение обычного ряда с информацией о заказе и кнопками "Редактировать" и "Удалить"
                    return (
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
                        <td>
                          <button
                            className="btn btn-primary me-2"
                            onClick={() => setEditingOrder(order)}
                          >
                            Редактировать
                          </button>
                          <button className="btn btn-danger" onClick={() => handleDelete(order.id)}>
                            Удалить
                          </button>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
};

export default OrdersPage;