import { useMemo, useState } from "react";
import { Download, FileUp, Percent } from "lucide-react";
import { formatCurrency } from "../formatters";
import type { Product } from "../types";

type ProductPricesPageProps = {
  products: Product[];
  onDownloadTemplate: () => void;
  onImportTemplate: (file: File) => void;
  onEditProduct: (product: Product) => void;
};

type PriceFilters = {
  query: string;
  minPrice: string;
  maxPrice: string;
  minOldPrice: string;
  maxOldPrice: string;
};

const emptyPriceFilters: PriceFilters = {
  query: "",
  minPrice: "",
  maxPrice: "",
  minOldPrice: "",
  maxOldPrice: "",
};

export function ProductPricesPage({
  products,
  onDownloadTemplate,
  onImportTemplate,
  onEditProduct,
}: ProductPricesPageProps) {
  const [filters, setFilters] = useState<PriceFilters>(emptyPriceFilters);
  const filteredProducts = useMemo(
    () => filterPriceProducts(products, filters),
    [filters, products],
  );
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Управление ценами</h2>
          <p>Редактируйте цены, старые цены и скидки товаров.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button" onClick={onDownloadTemplate}>
            <Download aria-hidden="true" />
            Скачать шаблон цен
          </button>
          <label className="secondary-button">
            <FileUp aria-hidden="true" />
            Загрузить цены из Excel
            <input
              type="file"
              className="visually-hidden"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImportTemplate(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" className="secondary-button" disabled>
            <Percent aria-hidden="true" />
            Массово изменить цены
          </button>
        </div>
      </div>

      <div className="product-filters" aria-label="Фильтры цен">
        <label>
          Товар или SKU
          <input
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="SKU или название"
          />
        </label>
        <label>
          Цена от
          <input
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })}
            placeholder="0"
          />
        </label>
        <label>
          Цена до
          <input
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}
            placeholder="100000"
          />
        </label>
        <label>
          Старая цена от
          <input
            inputMode="numeric"
            value={filters.minOldPrice}
            onChange={(event) => setFilters({ ...filters, minOldPrice: event.target.value })}
            placeholder="0"
          />
        </label>
        <label>
          Старая цена до
          <input
            inputMode="numeric"
            value={filters.maxOldPrice}
            onChange={(event) => setFilters({ ...filters, maxOldPrice: event.target.value })}
            placeholder="150000"
          />
        </label>
        <div className="product-filter-summary">
          <span>{`Найдено ${filteredProducts.length} из ${products.length}`}</span>
          <button
            type="button"
            className="table-button"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyPriceFilters)}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Название товара</th>
              <th>Категория</th>
              <th>Текущая цена</th>
              <th>Старая цена</th>
              <th>Скидка</th>
              <th>Статус цены</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const discount = getDiscount(product);

              return (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.oldPrice ? formatCurrency(product.oldPrice) : "—"}</td>
                  <td>{discount ? `${discount}%` : "—"}</td>
                  <td>
                    <span className="status-badge">{discount ? "Со скидкой" : "Обычная цена"}</span>
                  </td>
                  <td>
                    <button className="table-button" onClick={() => onEditProduct(product)}>
                      Изменить
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  {products.length === 0 ? "Товары пока не добавлены" : "Товары не найдены"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getDiscount(product: Product) {
  if (!product.oldPrice || product.oldPrice <= product.price) {
    return null;
  }

  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}

function filterPriceProducts(products: Product[], filters: PriceFilters) {
  const query = normalizeSearch(filters.query);
  const minPrice = parseFilterNumber(filters.minPrice);
  const maxPrice = parseFilterNumber(filters.maxPrice);
  const minOldPrice = parseFilterNumber(filters.minOldPrice);
  const maxOldPrice = parseFilterNumber(filters.maxOldPrice);

  return products.filter((product) => {
    const oldPrice = product.oldPrice ?? 0;

    if (
      query &&
      ![product.sku, product.name, product.category, String(product.price), String(product.oldPrice ?? "")]
        .map(normalizeSearch)
        .some((value) => value.includes(query))
    ) {
      return false;
    }

    if (minPrice !== null && product.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && product.price > maxPrice) {
      return false;
    }

    if (minOldPrice !== null && oldPrice < minOldPrice) {
      return false;
    }

    if (maxOldPrice !== null && oldPrice > maxOldPrice) {
      return false;
    }

    return true;
  });
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function parseFilterNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
