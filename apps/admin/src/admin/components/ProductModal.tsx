import type { FormEvent } from "react";
import type { ProductForm, ProductStatus } from "../types";

type ProductModalProps = {
  form: ProductForm;
  isEditing: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ProductModal({
  form,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: ProductModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? "Редактировать товар" : "Добавить товар"}</h2>
            <p>
              Данные пока сохраняются локально. После готовности backend они
              будут отправляться через API.
            </p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <form className="product-form" onSubmit={onSubmit}>
          <label>
            Название товара
            <input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              placeholder="Например, iPhone 15"
            />
          </label>

          <label>
            Категория
            <input
              value={form.category}
              onChange={(event) =>
                onChange({ ...form, category: event.target.value })
              }
              placeholder="Например, смартфоны"
            />
          </label>

          <label>
            Цена
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(event) =>
                onChange({ ...form, price: event.target.value })
              }
              placeholder="129990"
            />
          </label>

          <label>
            Остаток
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) =>
                onChange({ ...form, stock: event.target.value })
              }
              placeholder="12"
            />
          </label>

          <label>
            Статус
            <select
              value={form.status}
              onChange={(event) =>
                onChange({
                  ...form,
                  status: event.target.value as ProductStatus,
                })
              }
            >
              <option value="active">Активный</option>
              <option value="draft">Черновик</option>
              <option value="archived">Архив</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
