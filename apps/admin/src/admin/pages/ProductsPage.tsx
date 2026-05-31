import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, productStatusLabel } from "../formatters";
import { useLanguage } from "../../hooks/useLanguage";
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
  const { t } = useLanguage();

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>{t("manageProducts")}</h2>
          <p>{t("productsDescription")}</p>
        </div>
        <button className="primary-button" onClick={onAddProduct}>
          {t("addProduct")}
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("productListName")}</th>
              <th>{t("productListCategory")}</th>
              <th>{t("productListPrice")}</th>
              <th>{t("productListStock")}</th>
              <th>{t("productListStatus")}</th>
              <th>{t("actions")}</th>
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

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">
                  {t("noProducts")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}