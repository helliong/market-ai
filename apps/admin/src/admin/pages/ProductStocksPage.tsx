import { Download, FileUp, RefreshCw } from "lucide-react";
import type { Product } from "../types";

type ProductStocksPageProps = {
  products: Product[];
  onDownloadTemplate: () => void;
  onImportTemplate: (file: File) => void;
  onEditProduct: (product: Product) => void;
};

export function ProductStocksPage({
  products,
  onDownloadTemplate,
  onImportTemplate,
  onEditProduct,
}: ProductStocksPageProps) {
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
            {products.map((product) => {
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

            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-cell">
                  Товары пока не добавлены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getStockStatus(stock: number) {
  if (stock === 0) {
    return "Нет в наличии";
  }

  if (stock <= 5) {
    return "Мало осталось";
  }

  return "В наличии";
}
