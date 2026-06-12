import { Download, FileUp, Percent } from "lucide-react";
import { formatCurrency } from "../formatters";
import type { Product } from "../types";

type ProductPricesPageProps = {
  products: Product[];
  onDownloadTemplate: () => void;
  onImportTemplate: (file: File) => void;
  onEditProduct: (product: Product) => void;
};

export function ProductPricesPage({
  products,
  onDownloadTemplate,
  onImportTemplate,
  onEditProduct,
}: ProductPricesPageProps) {
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
            {products.map((product) => {
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

function getDiscount(product: Product) {
  if (!product.oldPrice || product.oldPrice <= product.price) {
    return null;
  }

  return Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
}
