import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { getCurrentSeller, logoutSellerAccount } from "./auth-api";
import { SellerAgreementPage } from "./agreement/SellerAgreementPage";
import { AdminDialog } from "./admin/components/AdminDialog";
import type { AdminDialogState } from "./admin/components/AdminDialog";
import { ProductModal } from "./admin/components/ProductModal";
import { emptyProductForm } from "./admin/data";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ProductsPage } from "./admin/pages/ProductsPage";
import { UsersPage } from "./admin/pages/UsersPage";
import type {
  OrderStatus,
  Order,
  Product,
  ProductForm,
  User,
  UserRole,
  UserStatus,
} from "./admin/types";
import { SellerLoginPage } from "./login/SellerLoginPage";
import { SellerRegisterPage } from "./register/SellerRegisterPage";
import { setTheme, useTheme } from "./settings-store";
import { SellerWelcomePage } from "./welcome/SellerWelcomePage";
import "./App.css";

type Page =
  | "welcome"
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "register"
  | "login"
  | "agreement";
type MenuPage = Exclude<Page, "welcome" | "register" | "login" | "agreement">;
type MenuItem = {
  label: string;
  icon: ReactNode;
};

const pageTitles: Record<MenuPage, MenuItem> = {
  dashboard: {
    label: "Обзор",
    icon: <LayoutDashboard aria-hidden="true" />,
  },
  products: {
    label: "Товары",
    icon: <Package aria-hidden="true" />,
  },
  orders: {
    label: "Заказы",
    icon: <ClipboardList aria-hidden="true" />,
  },
  users: {
    label: "Пользователи",
    icon: <Users aria-hidden="true" />,
  },
};

const pagePaths: Record<Page, string> = {
  welcome: "/",
  dashboard: "/dashboard",
  products: "/products",
  orders: "/orders",
  users: "/users",
  register: "/register",
  login: "/login",
  agreement: "/agreement",
};

function App() {
  const theme = useTheme();
  const [page, setPage] = useState<Page>(getInitialPage());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState("MarketAI Store");

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialog, setDialog] = useState<AdminDialogState | null>(null);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);

  useEffect(() => {
    function handlePopState() {
      setPage(getInitialPage());
      setIsMenuOpen(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (page === "welcome" || page === "register" || page === "login") {
      return;
    }

    let isMounted = true;

    async function loadSeller() {
      try {
        const seller = await getCurrentSeller();

        if (isMounted) {
          setStoreName(seller.storeName);
        }
      } catch {
        if (isMounted) {
          navigateToPage("login");
        }
      }
    }

    void loadSeller();

    return () => {
      isMounted = false;
    };
  }, [page]);

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

  function handleMenuItemClick(nextPage: MenuPage) {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }

    navigateToPage(nextPage);
  }

  function openStoreMenu() {
    setIsMenuOpen(true);
    setIsStoreMenuOpen(true);
  }

  function toggleSidebar() {
    if (isStoreMenuOpen) {
      setIsStoreMenuOpen(false);
      return;
    }

    setIsMenuOpen((current) => {
      return !current;
    });
  }

  async function restoreSellerSession() {
    const seller = await getCurrentSeller();
    setStoreName(seller.storeName);
  }

  function registerSeller(seller: { name: string; email: string }) {
    setStoreName(seller.name);
    navigateToPage("dashboard");
  }

  async function loginSeller() {
    await restoreSellerSession();
    navigateToPage("dashboard");
  }

  async function logoutSeller() {
    try {
      await logoutSellerAccount();
    } finally {
      setIsStoreMenuOpen(false);
      setIsMenuOpen(false);
      navigateToPage("login");
    }
  }

  if (page === "welcome") {
    return <SellerWelcomePage />;
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
      <aside
        className={`sidebar ${isMenuOpen ? "is-open" : ""}`}
        onClick={toggleSidebar}
      >
        <button
          type="button"
          className="logo"
          aria-expanded={isMenuOpen}
          aria-controls="admin-menu"
          onClick={(event) => {
            event.stopPropagation();
            toggleSidebar();
          }}
        >
          <span className="logo-mark">M</span>
          <span className="logo-text">
            <span className="logo-word">
              Market<span>AI</span>
            </span>
            <small>Продавцам</small>
          </span>
        </button>

        <nav id="admin-menu">
          {(Object.keys(pageTitles) as MenuPage[]).map((item) => (
            <button
              key={item}
              className={page === item ? "active" : ""}
              title={pageTitles[item].label}
              aria-label={pageTitles[item].label}
              onClick={(event) => {
                event.stopPropagation();
                handleMenuItemClick(item);
              }}
            >
              <span className="menu-icon">{pageTitles[item].icon}</span>
              <span className="menu-label">{pageTitles[item].label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="sidebar-store"
          title={storeName}
          aria-label={`Настройки магазина: ${storeName}`}
          onClick={(event) => {
            event.stopPropagation();
            openStoreMenu();
          }}
        >
          <span className="store-icon">
            <Settings aria-hidden="true" />
          </span>
          <span className="store-name">{storeName}</span>
        </button>
      </aside>

      {isStoreMenuOpen && (
        <div
          className="store-menu-backdrop"
          role="button"
          tabIndex={0}
          aria-label="Закрыть меню магазина"
          onClick={() => setIsStoreMenuOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              setIsStoreMenuOpen(false);
            }
          }}
        />
      )}

      <aside
        className={`store-subsidebar ${isStoreMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isStoreMenuOpen}
      >
        <div className="store-subsidebar-header">
          <div>
            <p>Магазин</p>
            <h2>{storeName}</h2>
          </div>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => setIsStoreMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="store-subsidebar-nav">
          <button type="button">Настройки</button>
          <button type="button">Юридические данные</button>
          <button type="button">Подписка на уведомления</button>
        </nav>

        <div className="store-subsidebar-actions">
          <div
            className={`store-subsidebar-theme ${theme === "dark" ? "is-dark" : ""}`}
            role="group"
            aria-label="Тема"
          >
            <span className="theme-slider-thumb" aria-hidden="true" />
            <button
              type="button"
              className={theme === "light" ? "active" : ""}
              aria-label="Светлая тема"
              onClick={() => setTheme("light")}
            >
              <Sun aria-hidden="true" />
            </button>
            <button
              type="button"
              className={theme === "dark" ? "active" : ""}
              aria-label="Темная тема"
              onClick={() => setTheme("dark")}
            >
              <Moon aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            className="store-subsidebar-logout"
            onClick={logoutSeller}
          >
            <LogOut aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>Панель администратора</h1>
            <p>Управление маркетплейсом MarketAI</p>
          </div>
          <button className="profile-button">Администратор</button>
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
    (item) =>
      pagePaths[item] === path ||
      (item === "welcome" && (path === "" || path === "/")),
  );

  return matchedPage ?? "welcome";
}

export default App;
