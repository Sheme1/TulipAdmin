import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase.config";

// Обновлённая типизация заказа с добавленным полем orderNumber для статического номера заказа.
export interface Order {
  id?: string; // Идентификатор из Firestore
  orderNumber?: number; // Статический номер заказа, который не меняется после создания
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

// Интерфейс пропсов для компонента формы заказа.
// orders — список уже существующих заказов, initialStocks — начальные запасы цветов по сортам.
interface OrderFormProps {
  orders: Order[];
  initialStocks: { [key: string]: number };
}

const OrderForm: React.FC<OrderFormProps> = ({ orders, initialStocks }) => {
  // Состояния полей формы
  const [customer, setCustomer] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("");
  const [flowerQuantity, setFlowerQuantity] = useState("");
  const [packaging, setPackaging] = useState<"Да" | "Нет">("Нет");
  // Состояние для выбора доставки
  const [delivery, setDelivery] = useState<"Да" | "Нет">("Нет");
  // Состояния для адреса и времени доставки
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [status, setStatus] = useState<"Новый" | "Выполняется" | "Выполнен">("Новый");
  const [createdBy, setCreatedBy] = useState<"Сервис" | "Пользователь">("Пользователь");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция обработки отправки формы
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Вычисляем общее количество уже заказанных цветов для выбранного сорта
    const existingQuantity = orders
      .filter(order => order.sort === sort)
      .reduce((sum, order) => sum + order.flowerQuantity, 0);
    // Получаем максимально доступное количество цветов для выбранного сорта
    const maxStock = initialStocks[sort];
    const newOrderQuantity = Number(flowerQuantity);

    // Если сумма уже заказанных и нового заказа превышает запас, выводим сообщение об ошибке
    if (existingQuantity + newOrderQuantity > maxStock) {
      setError(`Недостаточно остатков цветов для сорта ${sort}. Доступно: ${maxStock - existingQuantity}`);
      setLoading(false);
      return;
    }

    // Вычисляем новый статический номер заказа:
    // Берём все существующие номера заказов, если они заданы, иначе используем 0.
    const currentOrderNumbers = orders.map(o => o.orderNumber || 0);
    const maxOrderNumber = currentOrderNumbers.length > 0 ? Math.max(...currentOrderNumbers) : 0;
    const newOrderNumber = maxOrderNumber + 1;

    try {
      // Формируем объект заказа, добавляя новое поле orderNumber
      // Поскольку поля address и время доставки могут быть пустыми при выборе "Нет",
      // они передаются как есть.
      const orderData: Order = {
        customer,
        price: Number(price),
        sort,
        flowerQuantity: newOrderQuantity,
        packaging,
        deliveryAddress,
        deliveryTime,
        delivery,
        status,
        createdBy,
        orderNumber: newOrderNumber, // Присваиваем статический номер заказа
      };

      // Добавляем новый заказ в Firestore
      await addDoc(collection(db, "orders"), orderData);

      // Очищаем поля формы после успешного добавления заказа
      handleReset();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Ошибка добавления заказа:", err.message);
      } else {
        console.error("Ошибка добавления заказа");
      }
      setError("Ошибка добавления заказа");
    } finally {
      setLoading(false);
    }
  };

  // Функция для сброса (очищения) всех полей формы
  const handleReset = () => {
    setCustomer("");
    setPrice("");
    setSort("");
    setFlowerQuantity("");
    setPackaging("Нет");
    setDelivery("Нет");
    setDeliveryAddress("");
    setDeliveryTime("");
    setStatus("Новый");
    setCreatedBy("Пользователь");
  };

  return (
    <div className="card p-3 mt-4">
      <h4>Добавить новый заказ</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        {/* Клиент */}
        <div className="mb-3">
          <label htmlFor="customer" className="form-label">Клиент</label>
          <input
            type="text"
            id="customer"
            className="form-control"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            required
          />
        </div>

        {/* Цена заказа */}
        <div className="mb-3">
          <label htmlFor="price" className="form-label">Цена заказа</label>
          <input
            type="number"
            id="price"
            className="form-control"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Сорт */}
        <div className="mb-3">
          <label htmlFor="sort" className="form-label">Сорт</label>
          <select
            id="sort"
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            required
          >
            <option value="" disabled>Выберите сорт</option>
            <option value="Andre Citroen">Andre Citroen</option>
            <option value="Circuit">Circuit</option>
            <option value="First star">First star</option>
            <option value="Laptop">Laptop</option>
            <option value="White Master">White Master</option>
            <option value="Triple A">Triple A</option>
            <option value="Supemodel">Supemodel</option>
            <option value="Tresor">Tresor</option>
            <option value="Strong Love">Strong Love</option>
            <option value="Strong Gold">Strong Gold</option>
            <option value="Respectable">Respectable</option>
            <option value="Montezuma">Montezuma</option>
            <option value="Columbus">Columbus</option>
            <option value="Valdivia">Valdivia</option>
          </select>
        </div>

        {/* Количество цветов */}
        <div className="mb-3">
          <label htmlFor="flowerQuantity" className="form-label">Количество цветов</label>
          <input
            type="number"
            id="flowerQuantity"
            className="form-control"
            value={flowerQuantity}
            onChange={(e) => setFlowerQuantity(e.target.value)}
            required
            min="0"
          />
        </div>

        {/* Упаковка */}
        <div className="mb-3">
          <label htmlFor="packaging" className="form-label">Упаковка</label>
          <select
            id="packaging"
            className="form-select"
            value={packaging}
            onChange={(e) => setPackaging(e.target.value as "Да" | "Нет")}
            required
          >
            <option value="Да">Да</option>
            <option value="Нет">Нет</option>
          </select>
        </div>

        {/* Доставка */}
        <div className="mb-3">
          <label htmlFor="delivery" className="form-label">Доставка</label>
          <select
            id="delivery"
            className="form-select"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value as "Да" | "Нет")}
            required
          >
            <option value="Да">Да</option>
            <option value="Нет">Нет</option>
          </select>
        </div>

        {/* Условное отображение полей: Адрес и Время доставки показываются только если выбрано "Да" */}
        {delivery === "Да" && (
          <>
            {/* Адрес доставки */}
            <div className="mb-3">
              <label htmlFor="deliveryAddress" className="form-label">Адрес доставки</label>
              <input
                type="text"
                id="deliveryAddress"
                className="form-control"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            </div>

            {/* Время доставки */}
            <div className="mb-3">
              <label htmlFor="deliveryTime" className="form-label">Время доставки</label>
              <input
                type="datetime-local"
                id="deliveryTime"
                className="form-control"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Статус заказа */}
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Статус заказа</label>
          <select
            id="status"
            className="form-select"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "Новый" | "Выполняется" | "Выполнен")
            }
            required
          >
            <option value="Новый">Новый</option>
            <option value="Выполняется">Выполняется</option>
            <option value="Выполнен">Выполнен</option>
          </select>
        </div>

        {/* Кто создал заказ */}
        <div className="mb-3">
          <label htmlFor="createdBy" className="form-label">Кто создал заказ</label>
          <select
            id="createdBy"
            className="form-select"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value as "Сервис" | "Пользователь")}
            required
          >
            <option value="Сервис">Сервис</option>
            <option value="Пользователь">Пользователь</option>
          </select>
        </div>

        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? "Добавление..." : "Добавить заказ"}
        </button>
        <button type="button" className="btn btn-danger ms-2" onClick={handleReset}>
          Очистить форму
        </button>
      </form>
    </div>
  );
};

export default OrderForm;