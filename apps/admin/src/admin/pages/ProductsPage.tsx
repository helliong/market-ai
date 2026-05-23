import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, productStatusLabel } from "../formatters";
import type { Product } from "../types";

type ProductsPageProps = {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
};

export function ProductsPage({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductsPageProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Products management</h2>
          <p>Управление товарами, категориями, ценами и остатками</p>
        </div>
        <button className="primary-button" onClick={onAddProduct}>
          Добавить товар
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Остаток</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{formatCurrency(product.price)}</td>
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
                      Edit
                    </button>
                    <button
                      className="table-button danger"
                      onClick={() => onDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
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
