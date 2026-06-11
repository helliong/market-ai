import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileUp, Plus, X, XCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, productStatusLabel } from "../formatters";
import { productCategoriesTree, productMainCategories } from "../product-categories";
import { useLanguage } from "../../hooks/useLanguage";
import { searchSellerProducts } from "../../catalog-api";
import type { Product, ProductStatus } from "../types";

type ProductsPageProps = {
  products: Product[];
  canAddProducts: boolean;
  inactiveReason?: string;
  onAddProduct: () => void;
  onDownloadTemplate: () => void;
  onImportTemplate: (file: File) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
};

type ProductFilters = {
  sku: string;
  name: string;
  category: string;
  status: "" | ProductStatus;
  minPrice: string;
  maxPrice: string;
  minStock: string;
  maxStock: string;
};

const emptyFilters: ProductFilters = {
  sku: "",
  name: "",
  category: "",
  status: "",
  minPrice: "",
  maxPrice: "",
  minStock: "",
  maxStock: "",
};

export function ProductsPage({
  products,
  canAddProducts,
  inactiveReason,
  onAddProduct,
  onDownloadTemplate,
  onImportTemplate,
  onEditProduct,
  onDeleteProduct,
}: ProductsPageProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [serverSearchProducts, setServerSearchProducts] =
    useState<Product[]>(products);
  const [isSearching, setIsSearching] = useState(false);
  const textSearchQuery = [filters.sku, filters.name]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
  const usesServerSearch = Boolean(textSearchQuery);
  const productsForFilters = usesServerSearch ? serverSearchProducts : products;
  const filteredProducts = useMemo(
    () =>
      filterProducts(productsForFilters, filters, {
        skipTextFilters: usesServerSearch,
      }),
    [filters, productsForFilters, usesServerSearch],
  );
  const hasActiveFilters = Object.values(filters).some(Boolean);

  useEffect(() => {
    if (!textSearchQuery) {
      setServerSearchProducts(products);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      searchSellerProducts(textSearchQuery)
        .then((results) => {
          if (isMounted) {
            setServerSearchProducts(results);
          }
        })
        .catch((error) => {
          if (isMounted) {
            showToast(
              error instanceof Error
                ? error.message
                : "Не удалось выполнить поиск",
              "error",
            );
            setServerSearchProducts([]);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [products, textSearchQuery]);

  function showToast(message: string, variant: "success" | "error") {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  function handleAddProduct() {
    if (!canAddProducts) {
      showToast(inactiveReason || t("sellerStatusPendingLegal"), "error");
      return;
    }
    onAddProduct();
  }

  function handleImportClick() {
    if (!canAddProducts) {
      showToast(inactiveReason || t("sellerStatusPendingLegal"), "error");
      return;
    }

    fileInputRef.current?.click();
  }

  function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    onImportTemplate(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateFilter<K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K],
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  return (
    <section className="panel">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="section-header">
        <div>
          <h2>{t("manageProducts")}</h2>
          <p>{t("productsDescription")}</p>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onDownloadTemplate}
          >
            <Download aria-hidden="true" />
            Скачать шаблон
          </button>
          <button
            type="button"
            className="secondary-button"
            aria-disabled={!canAddProducts}
            onClick={handleImportClick}
            title={!canAddProducts ? inactiveReason : undefined}
          >
            <FileUp aria-hidden="true" />
            Прикрепить файл
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="visually-hidden"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
          <button
            className="primary-button"
            aria-disabled={!canAddProducts}
            onClick={handleAddProduct}
            title={!canAddProducts ? inactiveReason : undefined}
          >
            <Plus aria-hidden="true" />
            {t("addProduct")}
          </button>
        </div>
      </div>

      <div className="product-filters" aria-label="Фильтры товаров">
        <label>
          SKU
          <input
            value={filters.sku}
            onChange={(event) => updateFilter("sku", event.target.value)}
            placeholder="SKU-001"
          />
        </label>
        <label>
          Название
          <input
            value={filters.name}
            onChange={(event) => updateFilter("name", event.target.value)}
            placeholder="iPhone"
          />
        </label>
        <label>
          Категория
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
          >
            <option value="">Все категории</option>
            {productMainCategories.map((mainCat) => (
              <optgroup key={mainCat} label={mainCat}>
                {productCategoriesTree[mainCat].map((subCat) => (
                  <option key={subCat} value={subCat}>
                    {subCat}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Статус
          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter("status", event.target.value as ProductFilters["status"])
            }
          >
            <option value="">Все статусы</option>
            <option value="active">{t("active")}</option>
            <option value="draft">{t("draft")}</option>
            <option value="archived">{t("archived")}</option>
          </select>
        </label>
        <label>
          Цена от
          <input
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Цена до
          <input
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(event) => updateFilter("maxPrice", event.target.value)}
            placeholder="150000"
          />
        </label>
        <label>
          Остаток от
          <input
            inputMode="numeric"
            value={filters.minStock}
            onChange={(event) => updateFilter("minStock", event.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Остаток до
          <input
            inputMode="numeric"
            value={filters.maxStock}
            onChange={(event) => updateFilter("maxStock", event.target.value)}
            placeholder="100"
          />
        </label>
        <div className="product-filter-summary">
          <span>
            {isSearching
              ? "Ищем товары..."
              : `Найдено ${filteredProducts.length} из ${products.length}`}
          </span>
          <button
            type="button"
            className="table-button"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyFilters)}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Фото</th>
              <th>SKU</th>
              <th>{t("productListName")}</th>
              <th>{t("productListCategory")}</th>
              <th>{t("productListPrice")}</th>
              <th>Старая цена</th>
              <th>{t("productListStock")}</th>
              <th>{t("productListStatus")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>
                  <ProductThumbnail product={product} />
                </td>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>
                  {product.oldPrice ? (
                    <span style={{ textDecoration: "line-through", color: "var(--text-secondary, #9ca3af)" }}>
                      {formatCurrency(product.oldPrice)}
                    </span>
                  ) : (
                    <span style={{ opacity: 0.5 }}>—</span>
                  )}
                </td>
                <td>{product.stock}</td>
                <td>
                  <StatusBadge label={productStatusLabel(product.status)} />
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="table-button"
                      onClick={() => onEditProduct(product)}
                    >
                      {t("edit")}
                    </button>
                    <button
                      className="table-button danger"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      {t("delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  {products.length === 0 ? t("noProducts") : "Товары не найдены"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function filterProducts(
  products: Product[],
  filters: ProductFilters,
  options: { skipTextFilters?: boolean } = {},
) {
  const sku = normalizeSearch(filters.sku);
  const name = normalizeSearch(filters.name);
  const minPrice = parseFilterNumber(filters.minPrice);
  const maxPrice = parseFilterNumber(filters.maxPrice);
  const minStock = parseFilterNumber(filters.minStock);
  const maxStock = parseFilterNumber(filters.maxStock);

  return products.filter((product) => {
    if (!options.skipTextFilters && sku && !normalizeSearch(product.sku).includes(sku)) {
      return false;
    }

    if (!options.skipTextFilters && name && !normalizeSearch(product.name).includes(name)) {
      return false;
    }

    if (filters.category && product.category !== filters.category) {
      return false;
    }

    if (filters.status && product.status !== filters.status) {
      return false;
    }

    if (minPrice !== null && product.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && product.price > maxPrice) {
      return false;
    }

    if (minStock !== null && product.stock < minStock) {
      return false;
    }

    if (maxStock !== null && product.stock > maxStock) {
      return false;
    }

    return true;
  });
}

function ProductThumbnail({ product }: { product: Product }) {
  const images = product.images ?? [];
  const image =
    images.find((productImage) => productImage.isMain) ??
    images[0];

  if (!image) {
    return <span className="product-thumbnail-placeholder" aria-label="Нет фото" />;
  }

  return (
    <img
      className="product-thumbnail"
      src={image.url}
      alt=""
      loading="lazy"
    />
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function parseFilterNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

function ToastNotification({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: "success" | "error";
  onClose: () => void;
}) {
  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div className={`toast-notification toast-notification-${variant}`}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
      <button type="button" aria-label="Close notification" onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
