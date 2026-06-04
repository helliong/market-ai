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
import {
  getCurrentSeller,
  logoutSellerAccount,
  saveSellerLegalProfile,
  submitSellerLegalProfile,
} from "./auth-api";
import {
  createSellerProduct,
  deleteSellerProduct as deleteSellerProductRequest,
  downloadSellerProductsTemplate,
  getSellerProducts,
  importSellerProductsTemplate,
  updateSellerProduct,
} from "./catalog-api";
import type { SellerProfile, SellerLegalProfilePayload } from "./auth-api";
import { SellerAgreementPage } from "./agreement/SellerAgreementPage";
import { AdminDialog } from "./admin/components/AdminDialog";
import type { AdminDialogState } from "./admin/components/AdminDialog";
import { ProductModal } from "./admin/components/ProductModal";
import { emptyProductForm } from "./admin/data";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ProductsPage } from "./admin/pages/ProductsPage";
import { SettingsPage } from "./admin/pages/SettingsPage";
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
import { useLanguage } from "./hooks/useLanguage";
import "./App.css";

type Page =
  | "welcome"
  | "dashboard"
  | "products"
  | "orders"
  | "users"
  | "settings"
  | "register"
  | "login"
  | "agreement";

const pagePaths: Record<Page, string> = {
  welcome: "/",
  dashboard: "/dashboard",
  products: "/products",
  orders: "/orders",
  users: "/users",
  settings: "/settings",
  register: "/register",
  login: "/login",
  agreement: "/agreement",
};
type MenuPage = Exclude<
  Page,
  "welcome" | "register" | "login" | "agreement" | "settings"
>;

const PUBLIC_PAGES: Page[] = ["welcome", "register", "login", "agreement"];

// Корневой компонент продавческой админки: маршрутизация, меню, seller-сессия и состояние ЛК.
function App() {
  const { t } = useLanguage();
  const theme = useTheme();
  const [page, setPage] = useState<Page>(getInitialPage());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState("MarketAI Store");
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialog, setDialog] = useState<AdminDialogState | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const pageTitles: Record<MenuPage, { label: string; icon: ReactNode }> = {
    dashboard: {
      label: t("dashboard"),
      icon: <LayoutDashboard aria-hidden="true" />,
    },
    products: {
      label: t("products"),
      icon: <Package aria-hidden="true" />,
    },
    orders: {
      label: t("orders"),
      icon: <ClipboardList aria-hidden="true" />,
    },
    users: {
      label: t("users"),
      icon: <Users aria-hidden="true" />,
    },
  };

  useEffect(() => {
    function handlePopState() {
      setPage(getInitialPage());
      setIsMenuOpen(false);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (PUBLIC_PAGES.includes(page)) {
      return;
    }
    let isMounted = true;
    async function loadSeller() {
      try {
        const seller = await getCurrentSeller();
        if (isMounted) {
          setStoreName(seller.storeName);
          setSellerProfile(seller);
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

  useEffect(() => {
    if (page !== "products") {
      return;
    }

    let isMounted = true;

    async function loadProducts() {
      try {
        const sellerProducts = await getSellerProducts();
        if (isMounted) {
          setProducts(sellerProducts);
        }
      } catch (error) {
        if (isMounted) {
          setDialog({
            title: t("checkFields"),
            message:
              error instanceof Error
                ? error.message
                : "Failed to load products",
          });
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [page, t]);

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
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      price: formatMaskedNumber(product.price),
      stock: formatMaskedNumber(product.stock),
      status: product.status,
    });
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sku = productForm.sku.trim();
    const name = productForm.name.trim();
    const description = productForm.description.trim();
    const category = productForm.category.trim();
    const price = parseMaskedNumber(productForm.price);
    const stock = parseMaskedNumber(productForm.stock);
    if (!sku || !name || !category || price <= 0 || stock < 0) {
      setDialog({
        title: t("checkFields"),
        message: t("checkFieldsMessage"),
      });
      return;
    }

    try {
      const normalizedForm = {
        sku,
        name,
        description,
        category,
        price: String(price),
        stock: String(stock),
        status: productForm.status,
      };

      if (editingProduct) {
        const updatedProduct = await updateSellerProduct(
          editingProduct.id,
          normalizedForm,
        );
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === editingProduct.id ? updatedProduct : product,
          ),
        );
      } else {
        const newProduct = await createSellerProduct(normalizedForm);
        setProducts((currentProducts) => [newProduct, ...currentProducts]);
      }

      closeProductModal();
    } catch (error) {
      setDialog({
        title: t("checkFields"),
        message:
          error instanceof Error ? error.message : "Failed to save product",
      });
    }
  }

  async function handleDownloadProductTemplate() {
    try {
      const blob = await downloadSellerProductsTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "product-bulk-template.xlsx";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDialog({
        title: t("checkFields"),
        message:
          error instanceof Error ? error.message : "Failed to download template",
      });
    }
  }

  async function handleImportProductTemplate(file: File) {
    try {
      const result = await importSellerProductsTemplate(file);
      const sellerProducts = await getSellerProducts();
      setProducts(sellerProducts);
      setDialog({
        title: "Импорт завершен",
        message: `Создано: ${result.created}. Обновлено: ${result.updated}. Удалено: ${result.deleted}.`,
      });
    } catch (error) {
      setDialog({
        title: "Проверьте Excel-файл",
        message:
          error instanceof Error ? error.message : "Failed to import products",
      });
    }
  }

  function deleteProduct(productId: number) {
    setDialog({
      title: t("deleteProductTitle"),
      message: t("deleteProductMessage"),
      variant: "danger",
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      onConfirm: async () => {
        try {
          await deleteSellerProductRequest(productId);
          setProducts((currentProducts) =>
            currentProducts.filter((product) => product.id !== productId),
          );
        } catch (error) {
          setDialog({
            title: t("checkFields"),
            message:
              error instanceof Error
                ? error.message
                : "Failed to delete product",
          });
        }
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

  function openSettingsPage() {
    setIsStoreMenuOpen(false);
    setIsMenuOpen(true);
    navigateToPage("settings");
  }

  function toggleSidebar() {
    if (isStoreMenuOpen) {
      setIsStoreMenuOpen(false);
      return;
    }
    setIsMenuOpen((current) => !current);
  }

  async function restoreSellerSession() {
    const seller = await getCurrentSeller();
    setStoreName(seller.storeName);
    setSellerProfile(seller);
  }

  function registerSeller(seller: { name: string; email: string }) {
    setStoreName(seller.name);
    setSellerProfile(null);
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

  function handleDeactivateStore() {
    setDialog({
      title: t("settingsDeactivateTitle"),
      message: t("settingsDeactivateDialog"),
      variant: "danger",
      confirmLabel: t("settingsDeactivate"),
      cancelLabel: t("cancel"),
    });
  }

  function handleDeleteStore() {
    setDialog({
      title: t("settingsDeleteTitle"),
      message: t("settingsDeleteDialog"),
      variant: "danger",
      confirmLabel: t("settingsDelete"),
      cancelLabel: t("cancel"),
    });
  }

  async function handleSaveLegalProfile(payload: SellerLegalProfilePayload) {
    await saveSellerLegalProfile(payload);
    const seller = await getCurrentSeller();
    setSellerProfile(seller);
  }

  async function handleSubmitLegalProfile() {
    await submitSellerLegalProfile();
    const seller = await getCurrentSeller();
    setSellerProfile(seller);
  }

  function getSellerStatusMessage() {
    switch (sellerProfile?.status) {
      case "PENDING_LEGAL_DATA":
        return t("sellerStatusPendingLegal");
      case "UNDER_REVIEW":
        return t("sellerStatusUnderReview");
      case "REJECTED":
        return sellerProfile.reviewComment
          ? `${t("sellerStatusRejected")}: ${sellerProfile.reviewComment}`
          : t("sellerStatusRejected");
      case "SUSPENDED":
        return t("sellerStatusSuspended");
      default:
        return "";
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
            <small>{t("forSellers")}</small>
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
          aria-label={`${t("storeSettings")}: ${storeName}`}
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
          aria-label={t("closeMenu")}
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
            <p>{t("store")}</p>
            <h2>{storeName}</h2>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setIsStoreMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="store-subsidebar-nav">
          <button type="button" onClick={openSettingsPage}>
            {t("settings")}
          </button>
          <button type="button" onClick={openSettingsPage}>
            {t("legalData")}
          </button>
          <button type="button" onClick={openSettingsPage}>
            {t("settingsTeam")}
          </button>
        </nav>

        <div className="store-subsidebar-actions">
          <div
            className={`store-subsidebar-theme ${theme === "dark" ? "is-dark" : ""}`}
            role="group"
            aria-label={t("themeLabel")}
          >
            <span className="theme-slider-thumb" aria-hidden="true" />
            <button
              type="button"
              className={theme === "light" ? "active" : ""}
              aria-label={t("lightTheme")}
              onClick={() => setTheme("light")}
            >
              <Sun aria-hidden="true" />
            </button>
            <button
              type="button"
              className={theme === "dark" ? "active" : ""}
              aria-label={t("darkTheme")}
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
            {t("logout")}
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>{t("adminPanel")}</h1>
            <p>{t("adminSubtitle")}</p>
          </div>
          <button className="profile-button">{t("adminButton")}</button>
        </header>

        {page === "dashboard" && <DashboardPage stats={dashboardStats} />}
        {page === "products" && (
          <ProductsPage
            products={products}
            canAddProducts={sellerProfile?.status === "ACTIVATED"}
            inactiveReason={getSellerStatusMessage()}
            onAddProduct={openAddProductModal}
            onDownloadTemplate={handleDownloadProductTemplate}
            onImportTemplate={handleImportProductTemplate}
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
        {page === "settings" && (
          <SettingsPage
            storeName={storeName}
            sellerProfile={sellerProfile}
            onStoreNameChange={setStoreName}
            onSaveLegalProfile={handleSaveLegalProfile}
            onSubmitLegalProfile={handleSubmitLegalProfile}
            onDeactivateStore={handleDeactivateStore}
            onDeleteStore={handleDeleteStore}
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

// Определяет стартовую страницу админки по текущему URL.
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

function parseMaskedNumber(value: string) {
  return Number(value.replace(/\D/g, ""));
}

function formatMaskedNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export default App;
