import { useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, productStatusLabel } from "../formatters";
import { useLanguage } from "../../hooks/useLanguage";
import type { Product } from "../types";

type ProductsPageProps = {
  products: Product[];
  canAddProducts: boolean;
  inactiveReason?: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
};

// Страница товаров продавца: список, добавление, редактирование, удаление и toast-уведомления.
export function ProductsPage({
  products,
  canAddProducts,
  inactiveReason,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ProductsPageProps) {
  const { t } = useLanguage();
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    variant: "success" | "error";
  } | null>(null);

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
        <button
          className="primary-button"
          aria-disabled={!canAddProducts}
          onClick={handleAddProduct}
          title={!canAddProducts ? inactiveReason : undefined}
        >
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

// Toast-уведомление для действий с товарами внутри ЛК.
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
