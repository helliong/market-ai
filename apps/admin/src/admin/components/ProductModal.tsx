import type { FormEvent } from "react";
import type { ProductForm, ProductStatus } from "../types";
import { useLanguage } from "../../hooks/useLanguage";

type ProductModalProps = {
  form: ProductForm;
  isEditing: boolean;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

// Модальное окно добавления и редактирования товара продавца.
export function ProductModal({
  form,
  isEditing,
  onClose,
  onChange,
  onSubmit,
}: ProductModalProps) {
  const { t } = useLanguage();

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2>{isEditing ? t("editProduct") : t("addProduct")}</h2>
            <p>{t("productFormNote")}</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>

        <form className="product-form" onSubmit={onSubmit}>
          <label>
            {t("productName")}
            <input
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              placeholder="Например, iPhone 15"
            />
          </label>

          <label>
            {t("category")}
            <input
              value={form.category}
              onChange={(event) =>
                onChange({ ...form, category: event.target.value })
              }
              placeholder="Например, смартфоны"
            />
          </label>

          <label>
            {t("price")}
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
            {t("stock")}
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
            {t("status")}
            <select
              value={form.status}
              onChange={(event) =>
                onChange({
                  ...form,
                  status: event.target.value as ProductStatus,
                })
              }
            >
              <option value="active">{t("active")}</option>
              <option value="draft">{t("draft")}</option>
              <option value="archived">{t("archived")}</option>
            </select>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="primary-button">
              {isEditing ? t("save") : t("add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
