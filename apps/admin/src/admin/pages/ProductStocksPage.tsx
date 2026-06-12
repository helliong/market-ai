import { useMemo, useState } from "react";
import { Download, FileUp, RefreshCw } from "lucide-react";
import type { Product } from "../types";

type ProductStocksPageProps = {
  products: Product[];
  onDownloadTemplate: () => void;
  onImportTemplate: (file: File) => void;
  onEditProduct: (product: Product) => void;
};

type StockFilters = {
  query: string;
  minStock: string;
  maxStock: string;
  status: "";
  stockStatus: "" | "empty" | "low" | "available";
};

const emptyStockFilters: StockFilters = {
  query: "",
  minStock: "",
  maxStock: "",
  status: "",
  stockStatus: "",
};

export function ProductStocksPage({
  products,
  onDownloadTemplate,
  onImportTemplate,
  onEditProduct,
}: ProductStocksPageProps) {
  const [filters, setFilters] = useState<StockFilters>(emptyStockFilters);
  const filteredProducts = useMemo(
    () => filterStockProducts(products, filters),
    [filters, products],
  );
  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Остатки на складах</h2>
          <p>Следите за количеством товаров и доступностью к продаже.</p>
        </div>
        <div className="section-actions">
          <button type="button" className="secondary-button" onClick={onDownloadTemplate}>
            <Download aria-hidden="true" />
            Скачать шаблон остатков
          </button>
          <label className="secondary-button">
            <FileUp aria-hidden="true" />
            Загрузить остатки из Excel
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
            <RefreshCw aria-hidden="true" />
            Массово обновить остатки
          </button>
        </div>
      </div>

      <div className="product-filters" aria-label="Фильтры остатков">
        <label>
          Товар или SKU
          <input
            value={filters.query}
            onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            placeholder="SKU или название"
          />
        </label>
        <label>
          Остаток от
          <input
            inputMode="numeric"
            value={filters.minStock}
            onChange={(event) => setFilters({ ...filters, minStock: event.target.value })}
            placeholder="0"
          />
        </label>
        <label>
          Остаток до
          <input
            inputMode="numeric"
            value={filters.maxStock}
            onChange={(event) => setFilters({ ...filters, maxStock: event.target.value })}
            placeholder="100"
          />
        </label>
        <label>
          Статус наличия
          <select
            value={filters.stockStatus}
            onChange={(event) =>
              setFilters({
                ...filters,
                stockStatus: event.target.value as StockFilters["stockStatus"],
              })
            }
          >
            <option value="">Все статусы</option>
            <option value="empty">Нет в наличии</option>
            <option value="low">Мало осталось</option>
            <option value="available">В наличии</option>
          </select>
        </label>
        <div className="product-filter-summary">
          <span>{`Найдено ${filteredProducts.length} из ${products.length}`}</span>
          <button
            type="button"
            className="table-button"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyStockFilters)}
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
              <th>Общий остаток</th>
              <th>Резерв</th>
              <th>Доступно к продаже</th>
              <th>Статус наличия</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const reserved = 0;
              const available = Math.max(product.stock - reserved, 0);

              return (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.stock}</td>
                  <td>{reserved}</td>
                  <td>{available}</td>
                  <td>
                    <span className="status-badge">{getStockStatus(product.stock)}</span>
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

function filterStockProducts(products: Product[], filters: StockFilters) {
  const query = normalizeSearch(filters.query);
  const minStock = parseFilterNumber(filters.minStock);
  const maxStock = parseFilterNumber(filters.maxStock);

  return products.filter((product) => {
    if (
      query &&
      ![product.sku, product.name, product.category, String(product.stock)]
        .map(normalizeSearch)
        .some((value) => value.includes(query))
    ) {
      return false;
    }

    if (minStock !== null && product.stock < minStock) {
      return false;
    }

    if (maxStock !== null && product.stock > maxStock) {
      return false;
    }

    if (filters.stockStatus && getStockStatusKey(product.stock) !== filters.stockStatus) {
      return false;
    }

    return true;
  });
}

function getStockStatus(stock: number) {
  switch (getStockStatusKey(stock)) {
    case "empty":
      return "Нет в наличии";
    case "low":
      return "Мало осталось";
    default:
      return "В наличии";
  }
}

function getStockStatusKey(stock: number): StockFilters["stockStatus"] {
  if (stock === 0) {
    return "empty";
  }

  if (stock <= 5) {
    return "low";
  }

  return "available";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function parseFilterNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}
