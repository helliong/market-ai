import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  Package,
  PauseCircle,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import {
  getCurrentSeller,
  loginSellerAccount,
  logoutSellerAccount,
  pauseSellerStore,
  resumeSellerStore,
  saveSellerLegalProfile,
  submitSellerLegalProfile,
  updateSellerProfile,
} from "./auth-api";
import {
  createSellerProduct,
  deleteSellerProduct as deleteSellerProductRequest,
  downloadSellerProductsTemplate,
  getSellerProducts,
  importSellerProductsTemplate,
  updateSellerProduct,
} from "./catalog-api";
import { getSellerOrders, updateSellerOrderStatus } from "./order-api";
import type {
  SellerProfile,
  SellerLegalProfilePayload,
  UpdateSellerProfilePayload,
} from "./auth-api";
import { SellerAgreementPage } from "./agreement/SellerAgreementPage";
import { AdminDialog } from "./admin/components/AdminDialog";
import type { AdminDialogState } from "./admin/components/AdminDialog";
import { ProductModal } from "./admin/components/ProductModal";
import { emptyProductForm } from "./admin/data";
import { DashboardPage } from "./admin/pages/DashboardPage";
import { OrdersPage } from "./admin/pages/OrdersPage";
import { ProductImagesPage } from "./admin/pages/ProductImagesPage";
import { ProductPricesPage } from "./admin/pages/ProductPricesPage";
import { ProductStocksPage } from "./admin/pages/ProductStocksPage";
import { PromotionPage } from "./admin/pages/PromotionPage";
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
  | "productCatalog"
  | "productPrices"
  | "productStocks"
  | "productImages"
  | "orders"
  | "promotion"
  | "users"
  | "settings"
  | "register"
  | "login"
  | "agreement";

const pagePaths: Record<Page, string> = {
  welcome: "/",
  dashboard: "/dashboard",
  products: "/admin/products",
  productCatalog: "/admin/products/catalog",
  productPrices: "/admin/products/prices",
  productStocks: "/admin/products/stocks",
  productImages: "/admin/products/images",
  orders: "/orders",
  promotion: "/promotion",
  users: "/users",
  settings: "/settings",
  register: "/register",
  login: "/login",
  agreement: "/agreement",
};
type MenuPage = Exclude<
  Page,
  | "welcome"
  | "register"
  | "login"
  | "agreement"
  | "settings"
  | "productCatalog"
  | "productPrices"
  | "productStocks"
  | "productImages"
>;
type SidebarItem = MenuPage;

const PUBLIC_PAGES: Page[] = ["welcome", "register", "login", "agreement"];
const PRODUCT_PAGES: Page[] = [
  "products",
  "productCatalog",
  "productPrices",
  "productStocks",
  "productImages",
];
const productSubpages: Array<{ page: Page; label: string }> = [
  { page: "productCatalog", label: "Каталог" },
  { page: "productPrices", label: "Цены" },
  { page: "productStocks", label: "Остатки на складах" },
  { page: "productImages", label: "Загрузка изображений" },
];

// Корневой компонент продавческой админки: маршрутизация, меню, seller-сессия и состояние ЛК.
function App() {
  const { t } = useLanguage();
  const theme = useTheme();
  const [page, setPage] = useState<Page>(getInitialPage());
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [lastProductPage, setLastProductPage] = useState<Page>(
    PRODUCT_PAGES.includes(page) && page !== "products" ? page : "productCatalog",
  );
  const [storeName, setStoreName] = useState("MarketAI Store");
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialog, setDialog] = useState<AdminDialogState | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const pageTitles: Record<SidebarItem, { label: string; icon: ReactNode }> = {
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
    promotion: {
      label: "Продвижение",
      icon: <Megaphone aria-hidden="true" />,
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
    if (!PRODUCT_PAGES.includes(page)) {
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

  useEffect(() => {
    if (page !== "orders" && page !== "dashboard") {
      return;
    }

    let isMounted = true;

    async function loadOrders() {
      try {
        const [rawOrders, sellerProducts] = await Promise.all([
          getSellerOrders(),
          getSellerProducts(),
        ]);
        if (isMounted) {
          setProducts(sellerProducts);
          const mappedOrders: Order[] = rawOrders.map((ro) => {
            const sellerTotal = ro.items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
            const skus = ro.items
              .map((item) => sellerProducts.find((p) => p.id === item.productId)?.sku || "N/A")
              .join(", ");
            const titles = ro.items.map((item) => item.productTitleSnapshot).join(", ");
            
            const items = ro.items.map((item) => {
              const product = sellerProducts.find((p) => p.id === item.productId);
              const sku = product?.sku || "N/A";
              return {
                id: item.id,
                sku: sku,
                productName: item.productTitleSnapshot,
                quantity: item.quantity,
                price: Number(item.productPriceSnapshot),
                imageUrl: getMainProductImageUrl(product),
              };
            });

            let fStatus = ro.fulfillmentStatus.toLowerCase();
            if (fStatus === "canceled") fStatus = "cancelled";
            if (fStatus === "new") fStatus = "processing";
            if (fStatus === "received") fStatus = "completed";
            
            return {
              id: ro.id,
              publicId: ro.publicId,
              sku: skus,
              productName: titles,
              customer: ro.customerName || "Customer",
              customerPhone: ro.customerPhone,
              customerEmail: ro.customerEmail,
              deliveryMethod: ro.deliveryMethod,
              deliveryCity: ro.deliveryCity,
              deliveryStreet: ro.deliveryStreet,
              deliveryHouse: ro.deliveryHouse,
              deliveryFlat: ro.deliveryFlat,
              deliveryComment: ro.deliveryComment,
              total: sellerTotal,
              status: (fStatus as OrderStatus) || "processing",
              items: items,
              cancellationReason: ro.cancellationReason ?? undefined,
              cancelledAt: ro.cancelledAt,
              completedAt: ro.completedAt,
              updatedAt: ro.updatedAt,
              createdAt: ro.createdAt,
            };
          });
          setOrders(mappedOrders);
        }
      } catch (error) {
        if (isMounted) {
          setDialog({
            title: t("checkFields"),
            message: error instanceof Error ? error.message : "Failed to load orders",
          });
        }
      }
    }

    void loadOrders();

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
      oldPrice: product.oldPrice ? formatMaskedNumber(product.oldPrice) : "",
      stock: formatMaskedNumber(product.stock),
      status: product.status,
      images: (product.images ?? []).map((image, index) => ({
        url: image.url,
        isMain: image.isMain,
        sortOrder: index,
      })),
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
    const oldPrice = productForm.oldPrice ? parseMaskedNumber(productForm.oldPrice) : undefined;
    const stock = parseMaskedNumber(productForm.stock);
    if (!sku || !name || !category || price <= 0 || stock < 0) {
      setDialog({
        title: t("checkFields"),
        message: t("checkFieldsMessage"),
      });
      return;
    }

    if (sku.length > 20 || name.length > 60 || description.length > 2000) {
      setDialog({
        title: t("checkFields"),
        message:
          "SKU должен быть не длиннее 20 символов, название - до 60 символов, описание - до 2000 символов.",
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
        oldPrice: oldPrice ? String(oldPrice) : "",
        stock: String(stock),
        status: productForm.status,
        images: productForm.images.map((image, index) => ({
          ...image,
          sortOrder: index,
        })),
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
      link.download = `${formatStocksFileName(storeName)}.xlsx`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDialog({
        title: t("checkFields"),
        message:
          error instanceof Error
            ? error.message
            : "Failed to download template",
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

  async function updateOrderStatus(orderId: string, status: OrderStatus, reason?: string) {
    try {
      const updatedOrder = await updateSellerOrderStatus(orderId, status, reason);
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
                cancellationReason:
                  updatedOrder.cancellationReason ?? order.cancellationReason,
                cancelledAt: updatedOrder.cancelledAt,
                completedAt: updatedOrder.completedAt,
                updatedAt: updatedOrder.updatedAt,
              }
            : order,
        ),
      );
    } catch (error) {
      setDialog({
        title: t("checkFields"),
        message:
          error instanceof Error
            ? error.message
            : "Failed to update order status",
      });
    }
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
    const targetPage = nextPage === "products" ? lastProductPage : nextPage;
    if (PRODUCT_PAGES.includes(targetPage) && targetPage !== "products") {
      setLastProductPage(targetPage);
    }
    setPage(targetPage);
    window.history.pushState({}, "", pagePaths[targetPage]);
  }

  function handleMenuItemClick(nextPage: MenuPage) {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
    }
    if (nextPage === "products") {
      openProductsMenu();
      navigateToPage("products");
      return;
    }
    setIsProductsMenuOpen(false);
    setIsStoreMenuOpen(false);
    navigateToPage(nextPage);
  }

  function openProductsMenu() {
    setIsMenuOpen(true);
    setIsStoreMenuOpen(false);
    setIsProductsMenuOpen(true);
  }

  function openStoreMenu() {
    setIsMenuOpen(true);
    setIsProductsMenuOpen(false);
    setIsStoreMenuOpen(true);
  }

  function openSettingsPage() {
    setIsStoreMenuOpen(false);
    setIsProductsMenuOpen(false);
    setIsMenuOpen(true);
    navigateToPage("settings");
  }

  function toggleSidebar() {
    if (isStoreMenuOpen) {
      setIsStoreMenuOpen(false);
      return;
    }
    if (isProductsMenuOpen) {
      setIsProductsMenuOpen(false);
      return;
    }
    setIsMenuOpen((current) => !current);
  }

  async function restoreSellerSession() {
    const seller = await getCurrentSeller();
    setStoreName(seller.storeName);
    setSellerProfile(seller);
  }

  async function registerSeller(seller: { name: string; email: string; password: string }) {
    await loginSellerAccount({
      email: seller.email,
      password: seller.password,
    });
    await restoreSellerSession();
    setStoreName(seller.name);
    navigateToPage("dashboard");
  }

  async function loginSeller() {
    await restoreSellerSession();
    navigateToPage("dashboard");
  }

  async function handleWelcomeLoginClick() {
    try {
      await restoreSellerSession();
      navigateToPage("dashboard");
    } catch {
      navigateToPage("login");
    }
  }

  async function logoutSeller() {
    try {
      await logoutSellerAccount();
    } finally {
      setIsStoreMenuOpen(false);
      setIsProductsMenuOpen(false);
      setIsMenuOpen(false);
      navigateToPage("login");
    }
  }

  function handleDeactivateStore() {
    const isPaused = sellerProfile?.status === "PAUSED";

    setDialog({
      title: t(isPaused ? "settingsResumeTitle" : "settingsDeactivateTitle"),
      message: t(isPaused ? "settingsResumeDialog" : "settingsDeactivateDialog"),
      variant: "danger",
      confirmLabel: t(isPaused ? "settingsResume" : "settingsDeactivate"),
      cancelLabel: t("cancel"),
      onConfirm: async () => {
        try {
          const updatedProfile = isPaused
            ? await resumeSellerStore()
            : await pauseSellerStore();
          setSellerProfile(updatedProfile);
          setStoreName(updatedProfile.storeName);
        } catch (error) {
          setDialog({
            title: t("checkFields"),
            message:
              error instanceof Error
                ? error.message
                : "Failed to update store status",
          });
        }
      },
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

  async function handleSaveSellerProfile(payload: UpdateSellerProfilePayload) {
    const updatedProfile = await updateSellerProfile(payload);
    setSellerProfile(updatedProfile);
    setStoreName(updatedProfile.storeName);
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
      case "PAUSED":
        return t("sellerStatusPaused");
      default:
        return "";
    }
  }

  if (page === "welcome") {
    return <SellerWelcomePage onLoginClick={handleWelcomeLoginClick} />;
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
          {(Object.keys(pageTitles) as SidebarItem[]).map((item) => {
            const isPromotion = item === "promotion";

            return (
              <button
                key={item}
                className={`${item === "products" ? (PRODUCT_PAGES.includes(page) ? "active" : "") : page === item ? "active" : ""} ${isPromotion ? "is-coming-soon" : ""}`}
                title={
                  isPromotion
                    ? "Фича в разработке: продвижение товаров"
                    : pageTitles[item].label
                }
                aria-label={
                  isPromotion
                    ? "Продвижение товаров, фича в разработке"
                    : pageTitles[item].label
                }
                onClick={(event) => {
                  event.stopPropagation();
                  if (item === "products") {
                    openProductsMenu();
                    navigateToPage("products");
                    return;
                  }
                  handleMenuItemClick(item);
                }}
              >
                <span className="menu-icon">{pageTitles[item].icon}</span>
                <span className="menu-label">
                  {pageTitles[item].label}
                  {item === "products" && <ChevronRight aria-hidden="true" />}
                  {isPromotion && (
                    <span className="menu-soon-badge">Скоро</span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        {false && isMenuOpen && PRODUCT_PAGES.includes(page) && (
          <nav className="sidebar-product-submenu" aria-label="Разделы товаров">
            {productSubpages.map((subpage) => (
              <button
                key={subpage.page}
                type="button"
                className={page === subpage.page ? "active" : ""}
                onClick={(event) => {
                  event.stopPropagation();
                  navigateToPage(subpage.page);
                }}
              >
                {subpage.label}
              </button>
            ))}
          </nav>
        )}

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

      {isProductsMenuOpen && (
        <div
          className="store-menu-backdrop"
          role="button"
          tabIndex={0}
          aria-label="Закрыть меню товаров"
          onClick={() => setIsProductsMenuOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape" || event.key === "Enter") {
              setIsProductsMenuOpen(false);
            }
          }}
        />
      )}

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
        className={`store-subsidebar product-subsidebar ${isProductsMenuOpen ? "is-open" : ""}`}
        aria-hidden={!isProductsMenuOpen}
      >
        <div className="store-subsidebar-header">
          <div>
            <p>Раздел</p>
            <h2>Товары</h2>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={() => setIsProductsMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="store-subsidebar-nav product-subsidebar-nav">
          {productSubpages.map((subpage) => (
            <button
              key={subpage.page}
              type="button"
              className={page === subpage.page ? "active" : ""}
              onClick={() => {
                navigateToPage(subpage.page);
              }}
            >
              {subpage.label}
            </button>
          ))}
        </nav>
      </aside>

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
        {sellerProfile?.status === "PAUSED" && (
          <div className="store-paused-banner" role="status">
            <span className="store-paused-banner-icon">
              <PauseCircle aria-hidden="true" />
            </span>
            <div>
              <strong>{t("sellerPausedBannerTitle")}</strong>
              <p>{t("sellerPausedBannerDescription")}</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleDeactivateStore}
            >
              {t("settingsResume")}
            </button>
          </div>
        )}

        <header className="topbar">
          <div>
            <h1>{t("adminPanel")}</h1>
            <p>{t("adminSubtitle")}</p>
          </div>
          <button className="profile-button">{t("adminButton")}</button>
        </header>

        {page === "dashboard" && (
          <DashboardPage
            stats={dashboardStats}
            orders={orders}
            products={products}
            users={users}
            onNavigate={navigateToPage}
          />
        )}
        {page === "productCatalog" && (
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
        {page === "productPrices" && (
          <ProductPricesPage
            products={products}
            onDownloadTemplate={handleDownloadProductTemplate}
            onImportTemplate={handleImportProductTemplate}
            onEditProduct={openEditProductModal}
          />
        )}
        {page === "productStocks" && (
          <ProductStocksPage
            products={products}
            onDownloadTemplate={handleDownloadProductTemplate}
            onImportTemplate={handleImportProductTemplate}
            onEditProduct={openEditProductModal}
          />
        )}
        {page === "productImages" && (
          <ProductImagesPage
            products={products}
            onEditProduct={openEditProductModal}
          />
        )}
        {page === "orders" && (
          <OrdersPage orders={orders} onStatusChange={updateOrderStatus} />
        )}
        {page === "promotion" && <PromotionPage />}
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
            onSaveProfile={handleSaveSellerProfile}
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
          storeName={storeName}
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
  if (path === "/products" || path === "/admin/products") {
    window.history.replaceState({}, "", pagePaths.productCatalog);
    return "productCatalog";
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

function formatStocksFileName(storeName: string) {
  const name = storeName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${name || "store"}-stocks`;
}

function getMainProductImageUrl(product?: Product) {
  if (!product?.images?.length) {
    return undefined;
  }

  return (
    product.images.find((image) => image.isMain)?.url ??
    [...product.images].sort((left, right) => left.sortOrder - right.sortOrder)[0]?.url
  );
}

export default App;
