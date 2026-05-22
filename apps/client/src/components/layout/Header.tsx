"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Scale,
  X,
} from "lucide-react";
import { logout } from "@/store/authSlice";
import { categories } from "@/data/categories";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function Header() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const addressRef = useRef<HTMLDivElement>(null);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [language, setLanguage] = useState("Русский");
  const [city, setCity] = useState("Екатеринбург");
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  const favoritesCount = useAppSelector((state) => state.favorites.ids.length);

  const compareCount = useAppSelector((state) => state.compare.ids.length);
  const user = useAppSelector((state) => state.auth.user);
  const mobileNavItemClass = (isActive: boolean) =>
    `relative flex h-12 items-center justify-center rounded-xl px-2 py-2 transition hover:bg-[#6D4AFF] hover:text-white active:bg-[#4F32D9] active:text-white [&>span:last-child]:hidden ${
      isActive
        ? "bg-[#6D4AFF] text-white shadow-[0_10px_24px_rgba(109,74,255,0.26)]"
        : "text-[#6B7280]"
    }`;

  useEffect(() => {
    if (!isAddressOpen) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        addressRef.current &&
        !addressRef.current.contains(event.target as Node)
      ) {
        setIsAddressOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, [isAddressOpen]);

  useEffect(() => {
    if (!isProfileOpen) {
      return;
    }

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

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isProfileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 md:px-8 xl:flex-nowrap">
          <Link href="/" className="hidden shrink-0 items-center gap-3 xl:flex">
            <Image
              src="/logo.webp"
              alt="MarketAI logo"
              width={44}
              height={44}
              className="rounded-2xl"
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
              <p className="text-xs text-[#6B7280]">Доставка</p>
              <p className="max-w-[92px] truncate text-sm font-bold text-[#111827] sm:max-w-[110px]">
                {city}
              </p>
            </div>
          </button>

          {isAddressOpen && (
            <div className="fixed left-4 right-4 top-[76px] z-50 rounded-[24px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:absolute sm:left-0 sm:right-auto sm:top-[58px] sm:w-[320px]">
              <h3 className="text-lg font-black">Выберите город</h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                От города зависит срок и стоимость доставки
              </p>

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
            onClick={() => {
              setIsCatalogOpen((prev) => !prev);
              setIsAddressOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex h-11 items-center gap-2 rounded-2xl bg-[#F1EDFF] px-4 text-sm font-semibold text-[#6D4AFF] transition hover:bg-[#E8E0FF] sm:px-5"
          >
            <Menu size={18} />
            Каталог
          </button>

        </div>

        <div className="relative order-4 min-w-0 flex-1 xl:order-none xl:w-auto xl:basis-auto">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
          />
          <input
            placeholder="Найти товары или спросить ИИ..."
            className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
          />
        </div>

        <nav className="order-none ml-auto hidden items-center gap-2 xl:flex">
          <Link
            href="/compare"
            className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF] sm:px-3"
          >
            {compareCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
            <Scale size={20} />
            <span>Сравнить</span>
          </Link>

          <Link
            href="/favorites"
            className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF] sm:px-3"
          >
            {favoritesCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
            <Heart size={20} />
            <span>Избранное</span>
          </Link>

          <Link
            href="/cart"
            className="relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF] sm:px-3"
          >
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
            <ShoppingCart size={20} />
            <span>Корзина</span>
          </Link>

          <div ref={desktopProfileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsAddressOpen(false);
                setIsCatalogOpen(false);
              }}
              className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF] sm:px-3"
            >
              <User size={20} />
              <span>Профиль</span>
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
                        {user?.name || "Гость"}
                      </p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {user ? user.email : "Войдите или создайте аккаунт"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {user ? (
                      <>
                        <ProfileMenuLink
                          href="/profile"
                          icon={<User size={18} />}
                          label="Мой профиль"
                          onClick={() => setIsProfileOpen(false)}
                        />
                        <ProfileMenuAction
                          icon={<Package size={18} />}
                          label="История заказов"
                          onClick={() => setIsProfileOpen(false)}
                        />
                      </>
                    ) : (
                      <>
                        <ProfileMenuLink
                          href="/login"
                          icon={<User size={18} />}
                          label="Войти"
                          onClick={() => setIsProfileOpen(false)}
                        />
                        <ProfileMenuLink
                          href="/register"
                          icon={<UserPlus size={18} />}
                          label="Регистрация"
                          onClick={() => setIsProfileOpen(false)}
                        />
                      </>
                    )}
                    <ProfileLanguageSelect
                      value={language}
                      onChange={setLanguage}
                    />
                  </div>

                  {user && (
                    <button
                      type="button"
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                      onClick={() => {
                        dispatch(logout());
                        setIsProfileOpen(false);
                      }}
                    >
                      <LogOut size={18} />
                      Выйти
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
          className="fixed inset-0 z-[60] hidden animate-[catalogFadeIn_160ms_ease-out] dark:dark-bg-main/45 xl:inset-x-0 xl:bottom-0 xl:top-[76px] xl:z-40 xl:block xl:bg-[#111827]/45 xl:backdrop-blur-[2px] dark:backdrop-blur-[2px]"
          onClick={() => setIsCatalogOpen(false)}
        >
          <aside
            className="h-full w-full animate-[catalogSlideIn_220ms_cubic-bezier(0.22,1,0.36,1)] overflow-y-auto bg-white p-5 xl:w-[min(340px,86vw)] xl:border-r xl:border-[#E5E7EB] xl:shadow-[24px_0_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  className="mb-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-[#F1EDFF] px-4 text-sm font-bold text-[#6D4AFF] transition hover:bg-[#E8E0FF] xl:hidden"
                >
                  <Menu size={18} />
                  Каталог
                </button>
                <h3 className="text-lg font-black text-[#111827]">
                  Каталог товаров
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Выберите категорию для быстрого поиска
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCatalogOpen(false)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF] xl:flex"
                aria-label="Закрыть каталог"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <Link
                    key={category.id}
                    href={`/catalog?category=${category.id}`}
                    onClick={() => setIsCatalogOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-[#111827] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F6F7FB] text-[#6D4AFF]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {category.title}
                    </span>
                    <ChevronRight size={16} className="text-[#9CA3AF]" />
                  </Link>
                );
              })}
            </div>

            <Link
              href="/catalog"
              onClick={() => setIsCatalogOpen(false)}
              className="mt-4 flex h-12 items-center justify-between rounded-2xl bg-[#F6F7FB] px-4 text-sm font-black text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
            >
              Все категории
              <ChevronRight size={18} />
            </Link>
          </aside>
        </div>
      )}

      <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 gap-1 border-t border-[#E5E7EB] bg-white/95 px-3 py-2 backdrop-blur xl:hidden">
        <Link
          href="/"
          aria-label="Главная"
          className={mobileNavItemClass(pathname === "/")}
        >
          <Home size={21} />
        </Link>

        <Link
          href="/catalog"
          aria-label="Каталог"
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
          href="/compare"
          aria-label="Сравнить"
          className={mobileNavItemClass(pathname.startsWith("/compare"))}
        >
          {compareCount > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
              {compareCount}
            </span>
          )}
          <Scale size={21} />
          <span>Сравнить</span>
        </Link>

        <Link
          href="/favorites"
          aria-label="Избранное"
          className={mobileNavItemClass(pathname.startsWith("/favorites"))}
        >
          {favoritesCount > 0 && (
            <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
              {favoritesCount}
            </span>
          )}
          <Heart size={21} />
          <span>Избранное</span>
        </Link>

        <Link
          href="/cart"
          aria-label="Корзина"
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
          <span>Корзина</span>
        </Link>

        <div ref={mobileProfileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((prev) => !prev);
              setIsAddressOpen(false);
              setIsCatalogOpen(false);
            }}
            aria-label="Профиль"
            className={`${mobileNavItemClass(
              isProfileOpen ||
                pathname.startsWith("/profile") ||
                pathname.startsWith("/login") ||
                pathname.startsWith("/register"),
            )} w-full`}
          >
            <User size={21} />
            <span>Профиль</span>
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
                      {user?.name || "Гость"}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {user ? user.email : "Войдите или создайте аккаунт"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {user ? (
                    <>
                      <ProfileMenuLink
                        href="/profile"
                        icon={<User size={18} />}
                        label="Мой профиль"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <ProfileMenuAction
                        icon={<Package size={18} />}
                        label="История заказов"
                        onClick={() => setIsProfileOpen(false)}
                      />
                    </>
                  ) : (
                    <>
                      <ProfileMenuLink
                        href="/login"
                        icon={<User size={18} />}
                        label="Войти"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <ProfileMenuLink
                        href="/register"
                        icon={<UserPlus size={18} />}
                        label="Регистрация"
                        onClick={() => setIsProfileOpen(false)}
                      />
                    </>
                  )}
                  <ProfileLanguageSelect value={language} onChange={setLanguage} />
                </div>

                {user && (
                  <button
                    type="button"
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#FEF2F2] text-sm font-bold text-[#EF4444] transition hover:bg-[#FEE2E2]"
                    onClick={() => {
                      dispatch(logout());
                      setIsProfileOpen(false);
                    }}
                  >
                    <LogOut size={18} />
                    Выйти
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

function ProfileMenuAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-left text-sm font-bold text-[#111827] transition hover:bg-[#F6F7FB]"
    >
      <span className="text-[#6D4AFF]">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

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
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[112px] rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-bold text-[#111827] outline-none transition focus:border-[#6D4AFF]"
      >
        <option>Русский</option>
        <option>English</option>
        <option>Қазақша</option>
      </select>
    </label>
  );
}
