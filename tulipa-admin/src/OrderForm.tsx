import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase.config";

const OrderForm: React.FC = () => {
  const [customer, setCustomer] = useState("");
  const [total, setTotal] = useState("");
  const [status, setStatus] = useState("Новый");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        customer,
        total: Number(total),
        status,
      };

      await addDoc(collection(db, "orders"), orderData);
      // Очистка формы после успешного добавления заказа
      setCustomer("");
      setTotal("");
      setStatus("Новый");
    } catch (err: any) {
      console.error("Ошибка добавления заказа: ", err);
      setError("Ошибка добавления заказа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-3 mt-4">
      <h4>Добавить новый заказ</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
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
        <div className="mb-3">
          <label htmlFor="total" className="form-label">Сумма</label>
          <input
            type="number"
            id="total"
            className="form-control"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="status" className="form-label">Статус</label>
          <select
            id="status"
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="Новый">Новый</option>
            <option value="В обработке">В обработке</option>
            <option value="Завершён">Завершён</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success" disabled={loading}>
          {loading ? "Добавление..." : "Добавить заказ"}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
