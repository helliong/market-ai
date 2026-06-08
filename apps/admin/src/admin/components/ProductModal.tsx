import { useState, type FormEvent } from "react";
import { Info } from "lucide-react";
import type { ProductForm, ProductStatus } from "../types";
import { productCategories } from "../product-categories";
import { useLanguage } from "../../hooks/useLanguage";
import { ImageUploadZone } from "./ImageUploadZone";

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
  const { t } = useLanguage();

  function updatePrice(value: string) {
    onChange({ ...form, price: formatIntegerInput(value) });
  }

  function updateStock(value: string) {
    onChange({ ...form, stock: formatIntegerInput(value) });
  }

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
            SKU
            <input
              value={form.sku}
              onChange={(event) =>
                onChange({ ...form, sku: event.target.value })
              }
              placeholder="SKU-001"
            />
          </label>

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
            Описание
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              placeholder="Короткое описание товара"
            />
          </label>

          <div>
            <span className="product-form-label" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              Фотографии
              <InlineTooltip text="Поддерживаются любые форматы кроме горизонтальных (16:9). Рекомендуются квадратные или вертикальные фото." />
            </span>
            <ImageUploadZone
              images={form.images}
              onChange={(images) => onChange({ ...form, images })}
            />
          </div>

          <label>
            {t("category")}
            <select
              value={form.category}
              onChange={(event) =>
                onChange({ ...form, category: event.target.value })
              }
            >
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("price")}
            <input
              inputMode="numeric"
              value={form.price}
              onChange={(event) => updatePrice(event.target.value)}
              placeholder="129 990"
            />
          </label>

          <label>
            {t("stock")}
            <input
              inputMode="numeric"
              value={form.stock}
              onChange={(event) => updateStock(event.target.value)}
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

function formatIntegerInput(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? new Intl.NumberFormat("ru-RU").format(Number(digits)) : "";
}

function InlineTooltip({ text, tone = "gray" }: { text: string; tone?: "gray" | "red" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = tone === "red" ? "#ef4444" : "currentColor";

  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", transform: "translateY(-1px)" }}>
      <Info
        size={14}
        style={{ cursor: "pointer", opacity: tone === "red" ? 1 : 0.5, transition: "opacity 0.2s", color }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      />
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            backgroundColor: "#1f2937",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            width: "240px",
            zIndex: 20,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            lineHeight: 1.4,
            fontWeight: "normal",
            pointerEvents: "none",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}
