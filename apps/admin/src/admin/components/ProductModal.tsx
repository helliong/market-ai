import { useEffect, useState, type FormEvent } from "react";
import { Info, X } from "lucide-react";
import type { ProductForm, ProductStatus } from "../types";
import { productCategoriesTree, productMainCategories, getMainCategoryBySubcategory } from "../product-categories";
import { useLanguage } from "../../hooks/useLanguage";
import { ImageUploadZone } from "./ImageUploadZone";
import { buildStoreStorageFolder } from "../../storage-paths";

export type ProductModalMode = "catalog" | "prices" | "stocks" | "images";

type ProductModalProps = {
  form: ProductForm;
  isEditing: boolean;
  mode: ProductModalMode;
  storeName: string;
  onClose: () => void;
  onChange: (form: ProductForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

type AttributeField = {
  name: keyof Pick<
    ProductForm,
    | "color"
    | "size"
    | "memory"
    | "material"
    | "brand"
    | "country"
    | "barcode"
    | "gender"
    | "season"
    | "diagonal"
    | "processor"
    | "warranty"
    | "volume"
    | "bundle"
  >;
  label: string;
  placeholder: string;
};

export function ProductModal({
  form,
  isEditing,
  mode,
  storeName,
  onClose,
  onChange,
  onSubmit,
}: ProductModalProps) {
  const { t } = useLanguage();
  const [mainCategory, setMainCategory] = useState(() => getMainCategoryBySubcategory(form.category || ""));
  const isCatalogMode = mode === "catalog";
  const showCatalogFields = isCatalogMode || !isEditing;
  const showPriceFields = mode === "prices" || !isEditing;
  const showStockFields = mode === "stocks" || !isEditing;
  const showImageFields = mode === "images" || !isEditing;
  const attributeFields = getAttributeFields(mainCategory, form.category);

  useEffect(() => {
    if (form.category) {
      const computedMain = getMainCategoryBySubcategory(form.category);
      if (computedMain !== mainCategory) {
        setMainCategory(computedMain);
      }
    }
  }, [form.category, mainCategory]);

  useEffect(() => {
    document.body.classList.add("modal-open");

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, []);

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
            <h2>{getModalTitle(mode, isEditing, t("addProduct"))}</h2>
            <p>{t("productFormNote")}</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label={t("close")}>
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="product-form" onSubmit={onSubmit}>
          <label>
            SKU
            <input
              value={form.sku}
              disabled={!showCatalogFields}
              onChange={(event) =>
                onChange({ ...form, sku: event.target.value })
              }
              maxLength={20}
              placeholder="SKU-001"
            />
          </label>

          <label>
            {t("productName")}
            <input
              value={form.name}
              disabled={!showCatalogFields}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              maxLength={60}
              placeholder="Например, iPhone 15"
            />
          </label>

          {showCatalogFields && (
            <>
              <label>
                Описание
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    onChange({ ...form, description: event.target.value })
                  }
                  maxLength={2000}
                  placeholder="Короткое описание товара"
                />
              </label>

              <label>
                Основная категория
                <select
                  value={mainCategory}
                  onChange={(event) => {
                    const newMain = event.target.value;
                    setMainCategory(newMain);
                    onChange({ ...form, category: productCategoriesTree[newMain]?.[0] || "" });
                  }}
                >
                  {productMainCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Подкатегория
                <select
                  value={form.category}
                  onChange={(event) =>
                    onChange({ ...form, category: event.target.value })
                  }
                >
                  {(productCategoriesTree[mainCategory] || []).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              {attributeFields.map((field) => (
                <label key={field.name}>
                  {field.label}
                  <input
                    value={form[field.name]}
                    onChange={(event) =>
                      onChange({ ...form, [field.name]: event.target.value })
                    }
                    maxLength={80}
                    placeholder={field.placeholder}
                  />
                </label>
              ))}

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
            </>
          )}

          {showPriceFields && (
            <>
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
                Старая цена
                <input
                  inputMode="numeric"
                  value={form.oldPrice}
                  onChange={(event) => onChange({ ...form, oldPrice: formatIntegerInput(event.target.value) })}
                  placeholder="149 990"
                />
              </label>
            </>
          )}

          {showStockFields && (
            <label>
              {t("stock")}
              <input
                inputMode="numeric"
                value={form.stock}
                onChange={(event) => updateStock(event.target.value)}
                placeholder="12"
              />
            </label>
          )}

          {showImageFields && (
            <div>
              <span className="product-form-label" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                Фотографии
                <InlineTooltip text="Поддерживаются любые форматы кроме горизонтальных (16:9). Рекомендуются квадратные или вертикальные фото." />
              </span>
              <ImageUploadZone
                images={form.images}
                onChange={(images) => onChange({ ...form, images })}
                folder={buildStoreStorageFolder(storeName, "products", form.sku)}
                disabled={!form.sku.trim()}
                disabledMessage="Введите артикул (SKU) для загрузки фото"
              />
            </div>
          )}

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

function getModalTitle(mode: ProductModalMode, isEditing: boolean, addTitle: string) {
  if (!isEditing) {
    return addTitle;
  }

  const titles: Record<ProductModalMode, string> = {
    catalog: "Редактирование товара",
    prices: "Редактирование цен",
    stocks: "Редактирование остатков",
    images: "Редактирование изображений",
  };

  return titles[mode];
}

function getAttributeFields(mainCategory: string, category: string): AttributeField[] {
  const normalized = `${mainCategory} ${category}`.toLowerCase();
  const common: AttributeField[] = [
    { name: "brand", label: "Бренд", placeholder: "Adidas" },
    { name: "country", label: "Страна производства", placeholder: "Китай" },
    { name: "barcode", label: "Штрихкод", placeholder: "4601234567890" },
  ];

  if (normalized.includes("одеж") || normalized.includes("обув")) {
    return [
      { name: "color", label: "Цвет", placeholder: "Темно-синий" },
      { name: "size", label: "Размер", placeholder: "XS, S, M, L, XL или 42" },
      { name: "material", label: "Материал", placeholder: "Хлопок, полиэстер" },
      { name: "gender", label: "Пол", placeholder: "Мужской, женский, унисекс" },
      { name: "season", label: "Сезон", placeholder: "Лето" },
      ...common,
    ];
  }

  if (normalized.includes("электрон")) {
    return [
      { name: "color", label: "Цвет", placeholder: "Черный" },
      { name: "memory", label: "Память", placeholder: "256GB" },
      { name: "diagonal", label: "Диагональ", placeholder: "6.7\"" },
      { name: "processor", label: "Процессор", placeholder: "Snapdragon 7s Gen 2" },
      { name: "warranty", label: "Гарантия", placeholder: "12 месяцев" },
      ...common,
    ];
  }

  if (normalized.includes("спорт")) {
    return [
      { name: "color", label: "Цвет", placeholder: "Темно-зеленый" },
      { name: "size", label: "Размер", placeholder: "M" },
      { name: "material", label: "Материал", placeholder: "Полиэстер" },
      { name: "bundle", label: "Комплектация", placeholder: "1 шт." },
      ...common,
    ];
  }

  return [
    { name: "color", label: "Цвет", placeholder: "Белый" },
    { name: "size", label: "Размер", placeholder: "Универсальный" },
    { name: "material", label: "Материал", placeholder: "Пластик" },
    { name: "volume", label: "Объем", placeholder: "750 мл" },
    { name: "bundle", label: "Комплектация", placeholder: "1 шт." },
    ...common,
  ];
}

function InlineTooltip({ text, tone = "gray" }: { text: string; tone?: "gray" | "red" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const color = tone === "red" ? "#ef4444" : "currentColor";

  useEffect(() => {
    if (showTooltip && !isHovered) {
      const timer = setTimeout(() => setShowTooltip(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip, isHovered]);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", transform: "translateY(-1px)" }}
      onMouseEnter={() => {
        setShowTooltip(true);
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Info
        size={14}
        style={{ cursor: "pointer", opacity: tone === "red" ? 1 : 0.5, transition: "opacity 0.2s", color }}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
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
