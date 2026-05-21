"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-5 px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.webp"
              alt="MarketAI logo"
              width={44}
              height={44}
              className="rounded-2xl"
            />
            <span className="text-2xl font-bold tracking-tight">
              Market<span className="text-[#6D4AFF]">AI</span>
            </span>
          </Link>

        <div className="relative">
          <button
            onClick={() => {
              setIsAddressOpen((prev) => !prev);
              setIsCatalogOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex min-w-[170px] items-center gap-2 rounded-2xl px-3 py-2 text-left transition hover:bg-[#F6F7FB]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F1EDFF] text-[#6D4AFF]">
              <MapPin size={20} />
            </div>

            <div className="leading-tight">
              <p className="text-xs text-[#6B7280]">Доставка</p>
              <p className="max-w-[110px] truncate text-sm font-bold text-[#111827]">
                {city}
              </p>
            </div>
          </button>

          {isAddressOpen && (
            <div className="absolute left-0 top-[58px] z-50 w-[320px] rounded-[24px] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
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

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsCatalogOpen((prev) => !prev);
              setIsAddressOpen(false);
              setIsProfileOpen(false);
            }}
            className="flex h-11 items-center gap-2 rounded-2xl bg-[#F1EDFF] px-5 text-sm font-semibold text-[#6D4AFF] transition hover:bg-[#E8E0FF]"
          >
            <Menu size={18} />
            Каталог
          </button>

        </div>

        <div className="relative flex-1">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
          />
          <input
            placeholder="Найти товары или спросить ИИ..."
            className="h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] pl-12 pr-4 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
          />
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/compare"
            className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
          >
            {compareCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
            <Scale size={20} />
            Сравнить
          </Link>

          <Link
            href="/favorites"
            className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
          >
            {favoritesCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
            <Heart size={20} />
            Избранное
          </Link>

          <Link
            href="/cart"
            className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
          >
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
            <ShoppingCart size={20} />
            Корзина
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsAddressOpen(false);
                setIsCatalogOpen(false);
              }}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
            >
              <User size={20} />
              Профиль
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
          className="fixed inset-x-0 bottom-0 top-[76px] z-40 animate-[catalogFadeIn_160ms_ease-out] bg-[#111827]/45 backdrop-blur-[2px]"
          onClick={() => setIsCatalogOpen(false)}
        >
          <aside
            className="h-full w-[340px] animate-[catalogSlideIn_220ms_cubic-bezier(0.22,1,0.36,1)] border-r border-[#E5E7EB] bg-white p-5 shadow-[24px_0_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6F7FB] text-[#6B7280] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF]"
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
                    href={`/?category=${category.id}`}
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
              href="/"
              onClick={() => setIsCatalogOpen(false)}
              className="mt-4 flex h-12 items-center justify-between rounded-2xl bg-[#F6F7FB] px-4 text-sm font-black text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
            >
              Все категории
              <ChevronRight size={18} />
            </Link>
          </aside>
        </div>
      )}
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
