"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  User,
  Scale,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export function Header() {
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [city, setCity] = useState("Екатеринбург");
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0),
  );

  const favoritesCount = useAppSelector((state) => state.favorites.ids.length);

  const compareCount = useAppSelector((state) => state.compare.ids.length);
  return (
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
            onClick={() => setIsAddressOpen((prev) => !prev)}
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

        <button className="flex h-11 items-center gap-2 rounded-2xl bg-[#F1EDFF] px-5 text-sm font-semibold text-[#6D4AFF] transition hover:bg-[#E8E0FF]">
          <Menu size={18} />
          Каталог
        </button>

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
          <button className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]">
            {compareCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6D4AFF] px-1 text-[10px] font-bold text-white">
                {compareCount}
              </span>
            )}
            <Scale size={20} />
            Сравнить
          </button>

          <button className="relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]">
            {favoritesCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
                {favoritesCount}
              </span>
            )}
            <Heart size={20} />
            Избранное
          </button>

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

          <button className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#6D4AFF]">
            <User size={20} />
            Профиль
          </button>
        </nav>
      </div>
    </header>
  );
}
