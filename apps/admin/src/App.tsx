import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { SellerAgreementPage } from "./agreement/SellerAgreementPage";
import { AdminDialog } from "./admin/components/AdminDialog";
import type { AdminDialogState } from "./admin/components/AdminDialog";
import { ProductModal } from "./admin/components/ProductModal";
import { emptyProductForm, initialOrders, initialProducts, initialUsers } from "./admin/data";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ProductsPage } from "./admin/pages/ProductsPage";
import { UsersPage } from "./admin/pages/UsersPage";
import type {
  OrderStatus,
  Product,
  ProductForm,
  UserRole,
  UserStatus,
} from "./admin/types";
import { SellerLoginPage } from "./login/SellerLoginPage";
import { SellerRegisterPage } from "./register/SellerRegisterPage";
import "./App.css";

type Page =
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "register"
  | "login"
  | "agreement";
type MenuPage = Exclude<Page, "register" | "login" | "agreement">;

const pageTitles: Record<MenuPage, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  users: "Users",
};

const pagePaths: Record<Page, string> = {
  dashboard: "/",
  products: "/products",
  orders: "/orders",
  users: "/users",
  register: "/register",
  login: "/login",
  agreement: "/agreement",
};

function App() {
  const [page, setPage] = useState<Page>(getInitialPage());
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [users, setUsers] = useState(initialUsers);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialog, setDialog] = useState<AdminDialogState | null>(null);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);

  useEffect(() => {
    function handlePopState() {
      setPage(getInitialPage());
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const dashboardStats = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      products: products.length,
      orders: orders.length,
      users: users.length,
      revenue,
    };
  }, [orders, products, users]);

  function openAddProductModal() {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status,
    });
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  }

  function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);

    if (!name || !category || price <= 0 || stock < 0) {
      setDialog({
        title: "Проверьте поля",
        message:
          "Заполните название, категорию, цену больше нуля и корректный остаток.",
      });
      return;
    }

    if (editingProduct) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProduct.id
            ? {
                ...product,
                name,
                category,
                price,
                stock,
                status: productForm.status,
              }
            : product,
        ),
      );
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name,
        category,
        price,
        stock,
        status: productForm.status,
      };

      setProducts((currentProducts) => [newProduct, ...currentProducts]);
    }

    closeProductModal();
  }

  function deleteProduct(productId: number) {
    setDialog({
      title: "Удалить товар?",
      message: "Товар исчезнет из списка. Это действие нельзя отменить.",
      variant: "danger",
      confirmLabel: "Удалить",
      cancelLabel: "Оставить",
      onConfirm: () => {
        setProducts((currentProducts) =>
          currentProducts.filter((product) => product.id !== productId),
        );
      },
    });
  }

  function updateOrderStatus(orderId: string, status: OrderStatus) {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  }

  function updateUserRole(userId: number, role: UserRole) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, role } : user,
      ),
    );
  }

  function updateUserStatus(userId: number, status: UserStatus) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId ? { ...user, status } : user,
      ),
    );
  }

  function navigateToPage(nextPage: Page) {
    setPage(nextPage);
    window.history.pushState({}, "", pagePaths[nextPage]);
  }

  function registerSeller(seller: { name: string; email: string }) {
    setUsers((currentUsers) => [
      {
        id: Date.now(),
        name: seller.name,
        email: seller.email,
        role: "seller",
        status: "active",
      },
      ...currentUsers,
    ]);
    navigateToPage("dashboard");
  }

  function loginSeller() {
    navigateToPage("dashboard");
  }

  if (page === "login") {
    return <SellerLoginPage onSubmit={loginSeller} />;
  }

  if (page === "agreement") {
    return <SellerAgreementPage />;
  }

  if (page === "register") {
    return <SellerRegisterPage onSubmit={registerSeller} />;
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="logo">
          Market<span>AI</span>
        </div>

        <nav>
          {(Object.keys(pageTitles) as MenuPage[]).map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              onClick={() => navigateToPage(item)}
            >
              {pageTitles[item]}
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>Admin Panel</h1>
            <p>Управление маркетплейсом MarketAI</p>
          </div>
          <button className="profile-button">Admin</button>
        </header>

        {page === "dashboard" && <DashboardPage stats={dashboardStats} />}
        {page === "products" && (
          <ProductsPage
            products={products}
            onAddProduct={openAddProductModal}
            onEditProduct={openEditProductModal}
            onDeleteProduct={deleteProduct}
          />
        )}
        {page === "orders" && (
          <OrdersPage orders={orders} onStatusChange={updateOrderStatus} />
        )}
        {page === "users" && (
          <UsersPage
            users={users}
            onRoleChange={updateUserRole}
            onStatusChange={updateUserStatus}
          />
        )}
      </main>

      {isProductModalOpen && (
        <ProductModal
          form={productForm}
          isEditing={Boolean(editingProduct)}
          onClose={closeProductModal}
          onChange={setProductForm}
          onSubmit={handleProductSubmit}
        />
      )}

      {dialog && (
        <AdminDialog dialog={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function getInitialPage(): Page {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path === "/terms") {
    return "agreement";
  }

  const matchedPage = (Object.keys(pagePaths) as Page[]).find(
    (item) => pagePaths[item] === path || (item === "dashboard" && path === ""),
  );

  return matchedPage ?? "dashboard";
}

export default App;
