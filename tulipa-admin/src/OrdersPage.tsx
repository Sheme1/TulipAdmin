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
import OrderForm, { Order } from "./OrderForm";
import Header from "./Header";
import { useNavigate } from "react-router-dom";

/*
  Компонент OrdersPage — основная страница управления заказами.
  
  Изменения:
  1. Добавлены фильтры по всем параметрам заказа (клиент, цена, сорт, количество цветов, упаковка, адрес доставки, время доставки, доставка, статус, кто создал заказ).
  2. Поиск по ID теперь осуществляется по порядковому номеру записи в итоговом списке после применения остальных фильтров.
     Если в поле поиска введено число, то из отфильтрованного списка выбирается только та запись, чей порядковый номер (индекс + 1) равен введённому числу.
*/

// Задаем начальные запасы цветов по сортам с индексной сигнатурой для доступа по любому строковому ключу
const initialStocks: { [key: string]: number } = {
  "Andre Citroen": 300,
  "Circuit": 300,
  "First star": 300,
  "Laptop": 405,
  "White Master": 495,
  "Triple A": 300,
  "Supemodel": 300,
  "Tresor": 375,
  "Strong Love": 375,
  "Strong Gold": 375,
  "Respectable": 225,
  "Montezuma": 405,
  "Columbus": 225,
  "Valdivia": 225,
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();

  // Состояния для загрузки заказов, ошибок и списка заказов
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние для выбранной вкладки (добавление, список, поиск, остаток цветов)
  const [activeTab, setActiveTab] = useState<"add" | "list" | "search" | "inventory">("add");

  // Состояние редактируемого заказа
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Фильтры для поиска
  const [searchId, setSearchId] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchPriceMin, setSearchPriceMin] = useState("");
  const [searchPriceMax, setSearchPriceMax] = useState("");
  const [searchSort, setSearchSort] = useState("");
  const [searchFlowerQuantityMin, setSearchFlowerQuantityMin] = useState("");
  const [searchFlowerQuantityMax, setSearchFlowerQuantityMax] = useState("");
  const [searchPackaging, setSearchPackaging] = useState("");
  const [searchDeliveryAddress, setSearchDeliveryAddress] = useState("");
  const [searchDeliveryTimeMin, setSearchDeliveryTimeMin] = useState("");
  const [searchDeliveryTimeMax, setSearchDeliveryTimeMax] = useState("");
  const [searchDelivery, setSearchDelivery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchCreatedBy, setSearchCreatedBy] = useState("");

  // Подписка на изменения в коллекции заказов в Firestore
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
        console.error("Ошибка загрузки заказов:", err);
        setError("Ошибка загрузки заказов");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Функция удаления заказа
  const handleDelete = async (orderId: string) => {
    if (window.confirm("Вы уверены, что хотите удалить заказ?")) {
      try {
        await deleteDoc(doc(db, "orders", orderId));
      } catch (err) {
        console.error("Ошибка удаления заказа:", err);
      }
    }
  };

  // Функция сохранения изменений редактируемого заказа с проверкой доступности цветов
  const handleSave = async () => {
    if (editingOrder) {
      // Вычисляем количество заказанных цветов по данному сорту, исключая редактируемую запись
      const usedQuantityOther = orders
        .filter(order => order.sort === editingOrder.sort && order.id !== editingOrder.id!)
        .reduce((sum, order) => sum + order.flowerQuantity, 0);
      const maxStock = initialStocks[editingOrder.sort];

      if (usedQuantityOther + editingOrder.flowerQuantity > maxStock) {
        alert(`Недостаточно остатков цветов для сорта ${editingOrder.sort}. Доступно: ${maxStock - usedQuantityOther}`);
        return;
      }

      try {
        const orderRef = doc(db, "orders", editingOrder.id!);
        // Создаем копию объекта заказа и удаляем поле id
        const orderData = { ...editingOrder };
        delete orderData.id;
        await updateDoc(orderRef, orderData);
        setEditingOrder(null);
      } catch (err) {
        console.error("Ошибка обновления заказа:", err);
      }
    }
  };

  if (loading) return <div className="container mt-5">Загрузка заказов...</div>;
  if (error) return <div className="container mt-5 alert alert-danger">{error}</div>;

  // Применяем фильтры к списку заказов (без фильтра по порядковому номеру)
  const nonIdFilteredOrders = orders.filter((order) => {
    if (searchCustomer.trim() && !order.customer.toLowerCase().includes(searchCustomer.toLowerCase())) return false;
    if (searchPriceMin !== "" && order.price < Number(searchPriceMin)) return false;
    if (searchPriceMax !== "" && order.price > Number(searchPriceMax)) return false;
    if (searchSort !== "" && order.sort !== searchSort) return false;
    if (searchFlowerQuantityMin !== "" && order.flowerQuantity < Number(searchFlowerQuantityMin)) return false;
    if (searchFlowerQuantityMax !== "" && order.flowerQuantity > Number(searchFlowerQuantityMax)) return false;
    if (searchPackaging !== "" && order.packaging !== searchPackaging) return false;
    if (searchDeliveryAddress.trim() && !order.deliveryAddress.toLowerCase().includes(searchDeliveryAddress.toLowerCase())) return false;
    if (searchDeliveryTimeMin !== "" && new Date(order.deliveryTime) < new Date(searchDeliveryTimeMin)) return false;
    if (searchDeliveryTimeMax !== "" && new Date(order.deliveryTime) > new Date(searchDeliveryTimeMax)) return false;
    if (searchDelivery !== "" && order.delivery !== searchDelivery) return false;
    if (searchStatus !== "" && order.status !== searchStatus) return false;
    if (searchCreatedBy !== "" && order.createdBy !== searchCreatedBy) return false;
    return true;
  });

  // Используем статический номер заказа (order.orderNumber) для отображения и поиска.
  // Если order.orderNumber не задан (для устаревших заказов) используем порядковый номер элемента.
  const filteredOrdersWithStaticNumber = nonIdFilteredOrders.map((order, idx) => ({
    order,
    number: order.orderNumber !== undefined ? order.orderNumber : idx + 1,
  }));

  // При поиске по номеру заказа фильтруем записи по статическому номеру
  const filteredOrders = searchId.trim()
    ? filteredOrdersWithStaticNumber.filter(item => item.number === Number(searchId))
    : filteredOrdersWithStaticNumber;

  // Опции для селектора сортов
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

      {/* Навигационные вкладки */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>
            Добавление заказа
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>
            Список заказов
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "search" ? "active" : ""}`} onClick={() => setActiveTab("search")}>
            Поиск заказов
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
            Остаток цветов
          </button>
        </li>
      </ul>

      {/* Вкладка добавления заказа */}
      <section style={{ display: activeTab === "add" ? "block" : "none" }}>
        <OrderForm orders={orders} initialStocks={initialStocks} />
      </section>

      {/* Вкладка списка заказов */}
      {activeTab === "list" && (
        <section>
          {orders.length === 0 ? (
            <p>Нет заказов</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
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
                {filteredOrders.map(({ order, number }) =>
                  editingOrder && editingOrder.id === order.id ? (
                    <tr key={order.id!}>
                      <td>{number}</td>
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
                          className="form-control"
                          value={editingOrder.price}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, price: Number(e.target.value) })
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
                          <option value="">Выберите сорт</option>
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
                            setEditingOrder({ ...editingOrder, flowerQuantity: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.packaging}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, packaging: e.target.value as "Да" | "Нет" })
                          }
                        >
                          <option value="">Выберите упаковку</option>
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
                            setEditingOrder({ ...editingOrder, deliveryAddress: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editingOrder.deliveryTime}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, deliveryTime: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.delivery}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, delivery: e.target.value as "Да" | "Нет" })
                          }
                        >
                          <option value="">Выберите доставку</option>
                          <option value="Да">Да</option>
                          <option value="Нет">Нет</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.status}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, status: e.target.value as "Новый" | "Выполняется" | "Выполнен" })
                          }
                        >
                          <option value="">Выберите статус</option>
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
                            setEditingOrder({ ...editingOrder, createdBy: e.target.value as "Сервис" | "Пользователь" })
                          }
                        >
                          <option value="">Выберите, кто создал заказ</option>
                          <option value="Сервис">Сервис</option>
                          <option value="Пользователь">Пользователь</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-success me-2" onClick={handleSave}>
                          Сохранить
                        </button>
                        <button className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                          Отмена
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={order.id!}>
                      <td>{number}</td>
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
                        <button className="btn btn-primary me-2" onClick={() => setEditingOrder(order)}>
                          Редактировать
                        </button>
                        <button
                          className="btn btn-info me-2"
                          onClick={() => navigate(`/track/${order.id}`)}
                        >
                          Отслеживание
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(order.id!)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Вкладка поиска заказов */}
      {activeTab === "search" && (
        <section>
          <div className="card p-3 mb-4">
            <h4>Фильтрация заказов</h4>
            <div className="row g-3 mb-3">
              <div className="col-md-2">
                <label>Номер заказа</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Введите номер заказа"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Клиент</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Клиент"
                  value={searchCustomer}
                  onChange={(e) => setSearchCustomer(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Цена от</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="от"
                  value={searchPriceMin}
                  onChange={(e) => setSearchPriceMin(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Цена до</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="до"
                  value={searchPriceMax}
                  onChange={(e) => setSearchPriceMax(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Сорт</label>
                <select
                  className="form-select"
                  value={searchSort}
                  onChange={(e) => setSearchSort(e.target.value)}
                >
                  <option value="">Все сорта</option>
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-2">
                <label>Кол-во цветов от</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="от"
                  value={searchFlowerQuantityMin}
                  onChange={(e) => setSearchFlowerQuantityMin(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Кол-во цветов до</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="до"
                  value={searchFlowerQuantityMax}
                  onChange={(e) => setSearchFlowerQuantityMax(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label>Упаковка</label>
                <select
                  className="form-select"
                  value={searchPackaging}
                  onChange={(e) => setSearchPackaging(e.target.value)}
                >
                  <option value="">Любая</option>
                  <option value="Да">Да</option>
                  <option value="Нет">Нет</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>Адрес доставки</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Адрес доставки"
                  value={searchDeliveryAddress}
                  onChange={(e) => setSearchDeliveryAddress(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label>Доставка</label>
                <select
                  className="form-select"
                  value={searchDelivery}
                  onChange={(e) => setSearchDelivery(e.target.value)}
                >
                  <option value="">Любая</option>
                  <option value="Да">Да</option>
                  <option value="Нет">Нет</option>
                </select>
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-3">
                <label>Время доставки от</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={searchDeliveryTimeMin}
                  onChange={(e) => setSearchDeliveryTimeMin(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label>Время доставки до</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={searchDeliveryTimeMax}
                  onChange={(e) => setSearchDeliveryTimeMax(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label>Статус заказа</label>
                <select
                  className="form-select"
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                >
                  <option value="">Все статусы</option>
                  <option value="Новый">Новый</option>
                  <option value="Выполняется">Выполняется</option>
                  <option value="Выполнен">Выполнен</option>
                </select>
              </div>
              <div className="col-md-3">
                <label>Кто создал заказ</label>
                <select
                  className="form-select"
                  value={searchCreatedBy}
                  onChange={(e) => setSearchCreatedBy(e.target.value)}
                >
                  <option value="">Любой</option>
                  <option value="Сервис">Сервис</option>
                  <option value="Пользователь">Пользователь</option>
                </select>
              </div>
            </div>
          </div>
          {filteredOrders.length === 0 ? (
            <p>Нет заказов, соответствующих критериям поиска</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
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
                {filteredOrders.map(({ order, number }) =>
                  editingOrder && editingOrder.id === order.id ? (
                    <tr key={order.id!}>
                      <td>{number}</td>
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
                          className="form-control"
                          value={editingOrder.price}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, price: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={editingOrder.sort}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, sort: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={editingOrder.flowerQuantity}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, flowerQuantity: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.packaging}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, packaging: e.target.value as "Да" | "Нет" })
                          }
                        >
                          <option value="">Выберите упаковку</option>
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
                            setEditingOrder({ ...editingOrder, deliveryAddress: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={editingOrder.deliveryTime}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, deliveryTime: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.delivery}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, delivery: e.target.value as "Да" | "Нет" })
                          }
                        >
                          <option value="">Выберите доставку</option>
                          <option value="Да">Да</option>
                          <option value="Нет">Нет</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={editingOrder.status}
                          onChange={(e) =>
                            setEditingOrder({ ...editingOrder, status: e.target.value as "Новый" | "Выполняется" | "Выполнен" })
                          }
                        >
                          <option value="">Выберите статус</option>
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
                            setEditingOrder({ ...editingOrder, createdBy: e.target.value as "Сервис" | "Пользователь" })
                          }
                        >
                          <option value="">Выберите, кто создал заказ</option>
                          <option value="Сервис">Сервис</option>
                          <option value="Пользователь">Пользователь</option>
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-success me-2" onClick={handleSave}>
                          Сохранить
                        </button>
                        <button className="btn btn-secondary" onClick={() => setEditingOrder(null)}>
                          Отмена
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={order.id!}>
                      <td>{number}</td>
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
                        <button
                          className="btn btn-info me-2"
                          onClick={() => navigate(`/track/${order.id}`)}
                        >
                          Отслеживание
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(order.id!)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Вкладка "Остаток цветов" */}
      {activeTab === "inventory" && (
        <section>
          <h4>Остаток цветов</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Сорт</th>
                <th>Начальный запас</th>
                <th>Заказано</th>
                <th>Осталось</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(initialStocks).map(([sort, total]) => {
                // Вычисляем для каждого сорта сколько уже заказано и сколько осталось
                const used = orders
                  .filter(order => order.sort === sort)
                  .reduce((sum, order) => sum + order.flowerQuantity, 0);
                const remaining = total - used;
                return (
                  <tr key={sort}>
                    <td>{sort}</td>
                    <td>{total}</td>
                    <td>{used}</td>
                    <td>{remaining}</td>
                  </tr>
                );
              })}
              <tr>
                <td colSpan={3} className="text-end"><strong>Общее количество оставшихся цветов</strong></td>
                <td>
                  {
                    Object.entries(initialStocks).reduce((acc, [sort, total]) => {
                      const used = orders
                        .filter(order => order.sort === sort)
                        .reduce((sum, order) => sum + order.flowerQuantity, 0);
                      return acc + (total - used);
                    }, 0)
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default OrdersPage;