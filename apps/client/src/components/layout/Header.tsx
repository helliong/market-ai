"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ChevronRight,
  Heart,
  Home,
  Languages,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingCart,
  UserPlus,
  User,
  X,
} from "lucide-react";
import { logout } from "@/store/authSlice";
import { hydrateCart } from "@/store/cartSlice";
import { hydrateCompare } from "@/store/compareSlice";
import { hydrateFavorites } from "@/store/favoritesSlice";
import { clearOrders } from "@/store/ordersSlice";
import { categories } from "@/data/categories";
import { logoutClient } from "@/lib/auth-api";
import { fetchOrders, type ApiOrder } from "@/lib/order-api";
import { getCatalogSections } from "@/lib/catalog-data";
import { getCatalogSlug } from "@/lib/catalog-slug";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Header управляет навигацией, поиском, каталогом, профилем и быстрыми действиями магазина.
export function Header() {
  const { t, lang, changeLanguage } = useLanguage();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  const addressRef = useRef<HTMLDivElement>(null);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHeaderDocked, setIsHeaderDocked] = useState(false);
  const [hoveredCatalogCategory, setHoveredCatalogCategory] = useState<number>(
    categories[0]?.id ?? 1,
  );
  const [city, setCity] = useState("Екатеринбург");
  const [searchQuery, setSearchQuery] = useState("");
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const favoritesCount = useAppSelector((state) => state.favorites.ids.length);
  const user = useAppSelector((state) => state.auth.user);
  const isSessionRestored = useAppSelector(
    (state) => state.auth.isSessionRestored,
  );
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  const mobileNavItemClass = (isActive: boolean) =>
    `relative flex h-12 items-center justify-center rounded-xl px-2 py-2 transition hover:bg-[#6D4AFF] hover:text-white active:bg-[#4F32D9] active:text-white [&>span:last-child]:hidden ${
      isActive
        ? "bg-[#6D4AFF] text-white shadow-[0_10px_24px_rgba(109,74,255,0.26)]"
        : "text-[#6B7280]"
    }`;

  useEffect(() => {
    if (!isAddressOpen) return;
    function handleDocumentClick(event: MouseEvent) {
      if (
        addressRef.current &&
        !addressRef.current.contains(event.target as Node)
      ) {
        setIsAddressOpen(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [isAddressOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;
    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (
        desktopProfileRef.current?.contains(target) ||
        mobileProfileRef.current?.contains(target)
      ) {
        return;
      }
      setIsProfileOpen(false);
    }
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
  }, [isProfileOpen]);

  useEffect(() => {
    let isMounted = true;

    function updateActiveOrdersCount() {
      if (!isSessionRestored || !user) {
        setActiveOrdersCount(0);
        return;
      }

      fetchOrders()
        .then((orders) => {
          if (isMounted) {
            setActiveOrdersCount(orders.filter(isActiveOrder).length);
          }
        })
        .catch(() => {
          if (isMounted) {
            setActiveOrdersCount(0);
          }
        });
    }

    if (!isSessionRestored || !user) {
      setActiveOrdersCount(0);
      return;
    }

    updateActiveOrdersCount();
    window.addEventListener("orders-updated", updateActiveOrdersCount);

    return () => {
      isMounted = false;
      window.removeEventListener("orders-updated", updateActiveOrdersCount);
    };
  }, [isSessionRestored, pathname, user]);

  useEffect(() => {
    function handleOpenCatalog() {
      setIsCatalogOpen(true);
      setIsAddressOpen(false);
      setIsProfileOpen(false);
    }

    window.addEventListener("open-catalog", handleOpenCatalog);
    return () => window.removeEventListener("open-catalog", handleOpenCatalog);
  }, []);

  useEffect(() => {
    function updateHeaderDocked() {
      const adHeight = window.matchMedia("(min-width: 768px)").matches
        ? 44
        : 34;
      setIsHeaderDocked(window.scrollY >= adHeight);
    }

    updateHeaderDocked();
    window.addEventListener("scroll", updateHeaderDocked, { passive: true });
    window.addEventListener("resize", updateHeaderDocked);
    return () => {
      window.removeEventListener("scroll", updateHeaderDocked);
      window.removeEventListener("resize", updateHeaderDocked);
    };
  }, []);

  useEffect(() => {
    if (!isCatalogOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCatalogOpen]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    setIsAddressOpen(false);
    setIsCatalogOpen(false);
    setIsProfileOpen(false);
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
  }

  return (
    <>
      <div
        className="h-[34px] md:h-11"
        style={{
          background:
            "linear-gradient(90deg, #BDEBEC 0%, #C3ECEC 32%, #B1E7E8 68%, #A9E3E4 100%)",
        }}
      >
        <Image
          src="/aviasales-ad-header.png?v=20260603-2"
          alt="Aviasales advertisement"
          width={3318}
          height={474}
          priority
          className="mx-auto h-full w-full object-contain"
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:px-8 xl:flex-nowrap">
          <Link href="/" className="hidden shrink-0 items-center gap-3 xl:flex">
            <Image
              src="/logo.webp"
              alt="MarketAI logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-2xl"
            />
            <span className="hidden text-2xl font-bold tracking-tight sm:inline">
              Market<span className="text-[#6D4AFF]">AI</span>
            </span>
          </Link>

          <div
            ref={addressRef}
            className="relative order-3 shrink-0 xl:order-none xl:ml-0"
          >
            <button
              onClick={() => {
                setIsAddressOpen((prev) => !prev);
                setIsCatalogOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex min-w-0 items-center gap-2 rounded-2xl px-2 py-2 text-left transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF] sm:min-w-[170px] sm:px-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EDFF] text-[#6D4AFF]">
                <MapPin size={20} />
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs text-[#6B7280]">{t("delivery")}</p>
                <p className="max-w-[92px] truncate text-sm font-bold text-[#111827] sm:max-w-[110px]">
                  {city}
                </p>
              </div>
            </button>

            {isAddressOpen && (
              <div
                className={`fixed left-4 right-4 z-50 rounded-[24px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:absolute sm:left-0 sm:right-auto sm:top-[58px] sm:w-[320px] ${
                  isHeaderDocked ? "top-[76px]" : "top-[110px]"
                }`}
              >
                <h3 className="text-lg font-black">{t("chooseCity")}</h3>
                <p className="mt-1 text-sm text-[#6B7280]">{t("cityNote")}</p>
                <div className="mt-4 space-y-2">
                  {["Екатеринбург", "Москва", "Санкт-Петербург", "Казань"].map(
                    (item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setCity(item);
                          setIsAddressOpen(false);
                        }}
                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative order-2 hidden xl:order-none xl:block">
            <button
              type="button"
              aria-expanded={isCatalogOpen}
              onClick={() => {
                setIsCatalogOpen((prev) => !prev);
                setIsAddressOpen(false);
                setIsProfileOpen(false);
              }}
              className={`catalog-toggle-button flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition sm:px-5 ${
                isCatalogOpen
                  ? "bg-[#6D4AFF] text-white shadow-[0_10px_24px_rgba(109,74,255,0.26)] hover:bg-[#4F32D9]"
                  : "bg-[#F1EDFF] text-[#6D4AFF] hover:bg-[#E8E0FF]"
              }`}
            >
              {isCatalogOpen ? <X size={18} /> : <Menu size={18} />}
              {t("catalog")}
            </button>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="relative order-4 min-w-0 flex-1 xl:order-none xl:w-auto xl:basis-auto"
          >
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
            />
          </form>

          <nav className="order-none ml-auto hidden items-center gap-2 xl:flex">
            <Link
              href="/orders"
              className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] sm:px-3"
            >
              {activeOrdersCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                  {activeOrdersCount}
                </span>
              )}
              <Package size={20} />
              <span>{t("orderHistory")}</span>
            </Link>

            <Link
              href="/favorites"
              className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] sm:px-3"
            >
              {favoritesCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                  {favoritesCount}
                </span>
              )}
              <Heart size={20} />
              <span>{t("favorites")}</span>
            </Link>

            <Link
              href="/cart"
              className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] sm:px-3"
            >
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
              <ShoppingCart size={20} />
              <span>{t("cart")}</span>
            </Link>

            <div ref={desktopProfileRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsAddressOpen(false);
                  setIsCatalogOpen(false);
                }}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] sm:px-3"
              >
                <User size={20} />
                <span>{t("profile")}</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full z-50 w-[340px] pt-2">
                  <div className="rounded-[24px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                    <div className="flex items-center gap-4 border-b border-[#E5E7EB] pb-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                        <User size={24} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-[#111827]">
                          {user?.name || t("guest")}
                        </p>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {user ? user.email : t("loginOrRegister")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {user ? (
                        <>
                          <ProfileMenuLink
                            href="/profile"
                            icon={<User size={18} />}
                            label={t("myProfile")}
                            onClick={() => setIsProfileOpen(false)}
                          />
                          <ProfileMenuLink
                            href="/orders"
                            icon={<Package size={18} />}
                            label={t("orderHistory")}
                            onClick={() => setIsProfileOpen(false)}
                          />
                        </>
                      ) : (
                        <>
                          <ProfileMenuLink
                            href="/login"
                            icon={<User size={18} />}
                            label={t("login")}
                            onClick={() => setIsProfileOpen(false)}
                          />
                          <ProfileMenuLink
                            href="/register"
                            icon={<UserPlus size={18} />}
                            label={t("register")}
                            onClick={() => setIsProfileOpen(false)}
                          />
                        </>
                      )}
                      <ProfileLanguageSelect
                        value={lang}
                        onChange={changeLanguage}
                      />
                    </div>

                    {user && (
                      <button
                        type="button"
                        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                        onClick={async () => {
                          try {
                            await logoutClient();
                          } finally {
                            dispatch(logout());
                            dispatch(hydrateCart([]));
                            dispatch(hydrateFavorites([]));
                            dispatch(hydrateCompare([]));
                            dispatch(clearOrders());
                            setIsProfileOpen(false);
                          }
                        }}
                      >
                        <LogOut size={18} />
                        {t("logout")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {isCatalogOpen && (
        <div
          className="fixed inset-0 z-[60] hidden animate-[catalogFadeIn_160ms_ease-out] bg-[var(--bg-main)] xl:inset-x-0 xl:bottom-0 xl:z-40 xl:block"
          style={{ top: isHeaderDocked ? 76 : 120 }}
          onClick={() => setIsCatalogOpen(false)}
        >
          <section
            className="relative mx-auto grid w-full max-w-[1440px] grid-cols-[300px_1fr] overflow-hidden bg-white"
            style={{ height: `calc(100vh - ${isHeaderDocked ? 76 : 120}px)` }}
            onClick={(event) => event.stopPropagation()}
          >
            <aside className="h-full overflow-y-auto border-r border-[#E5E7EB] p-4">
              <div className="mb-3 flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-[var(--text-main)]">
                  Каталог
                </h3>
              </div>
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isActive = hoveredCatalogCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onMouseEnter={() =>
                        setHoveredCatalogCategory(category.id)
                      }
                      onFocus={() => setHoveredCatalogCategory(category.id)}
                      className={`flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition ${
                        isActive
                          ? "bg-[#F1EDFF] text-[#6D4AFF]"
                          : "text-[#111827] hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6D4AFF]">
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {t(category.title)}
                      </span>
                      <ChevronRight size={15} className="text-[#CBD5E1]" />
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="h-full min-w-0 overflow-y-auto p-6">
              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="absolute right-6 top-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                aria-label={t("closeCatalog")}
              >
                <X size={18} />
              </button>
              <div className="pr-12">
                <p className="text-sm font-black text-[#6B7280]">
                  Категории MarketAI
                </p>
                <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)]">
                  {t(
                    categories.find(
                      (category) => category.id === hoveredCatalogCategory,
                    )?.title ?? "Каталог",
                  )}
                </h2>
              </div>

              <div className="mt-7 columns-1 gap-8 md:columns-2 xl:columns-3">
                {getCatalogSections(hoveredCatalogCategory).map((section) => (
                  <div key={section.title} className="mb-7 break-inside-avoid">
                    <h3 className="text-base font-black text-[var(--text-main)]">
                      {section.title}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {section.items.map((item) => (
                        <Link
                          key={item}
                          href={`/catalog/${getCatalogSlug(item)}`}
                          onClick={() => setIsCatalogOpen(false)}
                          className="block text-sm font-semibold leading-6 text-[#64748B] transition hover:text-[#6D4AFF]"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#6D4AFF] transition hover:text-[#4F32D9]"
                    >
                      Еще <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 gap-1 border-t border-[#E5E7EB] bg-white/95 px-3 py-2 backdrop-blur xl:hidden">
        <Link
          href="/"
          aria-label={t("home")}
          className={mobileNavItemClass(pathname === "/")}
        >
          <Home size={21} />
        </Link>

        <Link
          href="/catalog"
          aria-label={t("catalog")}
          onClick={() => {
            setIsCatalogOpen(false);
            setIsAddressOpen(false);
            setIsProfileOpen(false);
          }}
          className={mobileNavItemClass(pathname.startsWith("/catalog"))}
        >
          <Search size={21} />
        </Link>

        <Link
          href="/orders"
          aria-label={t("orderHistory")}
          className={mobileNavItemClass(pathname.startsWith("/orders"))}
        >
          {activeOrdersCount > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
              {activeOrdersCount}
            </span>
          )}
          <Package size={21} />
          <span>{t("orderHistory")}</span>
        </Link>

        <Link
          href="/favorites"
          aria-label={t("favorites")}
          className={mobileNavItemClass(pathname.startsWith("/favorites"))}
        >
          {favoritesCount > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
              {favoritesCount}
            </span>
          )}
          <Heart size={21} />
          <span>{t("favorites")}</span>
        </Link>

        <Link
          href="/cart"
          aria-label={t("cart")}
          className={mobileNavItemClass(
            pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
          )}
        >
          {cartCount > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
          <ShoppingCart size={21} />
          <span>{t("cart")}</span>
        </Link>

        <div ref={mobileProfileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsAddressOpen(false);
              setIsCatalogOpen(false);
            }}
            aria-label={t("profile")}
            className={`${mobileNavItemClass(
              isProfileOpen ||
                pathname.startsWith("/profile") ||
                pathname.startsWith("/login") ||
                pathname.startsWith("/register"),
            )} w-full`}
          >
            <User size={21} />
            <span>{t("profile")}</span>
          </button>

          {isProfileOpen && (
            <div className="fixed bottom-[74px] left-4 right-4 z-50">
              <div className="rounded-[24px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
                <div className="flex items-center gap-4 border-b border-[#E5E7EB] pb-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
                    <User size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-[#111827]">
                      {user?.name || t("guest")}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {user ? user.email : t("loginOrRegister")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {user ? (
                    <>
                      <ProfileMenuLink
                        href="/profile"
                        icon={<User size={18} />}
                        label={t("myProfile")}
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <ProfileMenuLink
                        href="/orders"
                        icon={<Package size={18} />}
                        label={t("orderHistory")}
                        onClick={() => setIsProfileOpen(false)}
                      />
                    </>
                  ) : (
                    <>
                      <ProfileMenuLink
                        href="/login"
                        icon={<User size={18} />}
                        label={t("login")}
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <ProfileMenuLink
                        href="/register"
                        icon={<UserPlus size={18} />}
                        label={t("register")}
                        onClick={() => setIsProfileOpen(false)}
                      />
                    </>
                  )}
                  <ProfileLanguageSelect
                    value={lang}
                    onChange={changeLanguage}
                  />
                </div>

                {user && (
                  <button
                    type="button"
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                    onClick={async () => {
                      try {
                        await logoutClient();
                      } finally {
                        dispatch(logout());
                        dispatch(hydrateCart([]));
                        dispatch(hydrateFavorites([]));
                        dispatch(hydrateCompare([]));
                        dispatch(clearOrders());
                        setIsProfileOpen(false);
                      }
                    }}
                  >
                    <LogOut size={18} />
                    {t("logout")}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

// Ссылка внутри меню профиля, которая закрывает меню после перехода.
function ProfileMenuLink({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-[#111827] transition hover:bg-[#F6F7FB]"
    >
      <span className="text-[#6D4AFF]">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

// Селект языка внутри меню профиля.
function ProfileLanguageSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold text-[#111827] transition hover:bg-[#F6F7FB]">
      <span className="text-[#6D4AFF]">
        <Languages size={18} />
      </span>
      <span className="flex-1">Смена языка</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[112px] rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-bold text-[#111827] outline-none transition focus:border-[#6D4AFF]"
      >
        <option value="ru">Русский</option>
        <option value="en">English</option>
        <option value="kk">Қазақша</option>
      </select>
    </label>
  );
}

function isActiveOrder(order: ApiOrder) {
  const status = order.status.toLowerCase();
  const fulfillmentStatus = order.fulfillmentStatus.toLowerCase();

  return !(
    status.includes("cancel") ||
    status.includes("complete") ||
    fulfillmentStatus.includes("cancel") ||
    fulfillmentStatus.includes("received")
  );
}
