"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Bot, Heart, Languages, Mail, MapPin, Moon, Phone, Sun } from "lucide-react";

const footerLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/favorites", label: "Избранное" },
  { href: "/compare", label: "Сравнение" },
  { href: "/cart", label: "Корзина" },
  { href: "/profile", label: "Профиль" },
  { href: "/agreement", label: "Соглашение" },
];

const settingsEvent = "marketai-settings";

function subscribeToSettings(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(settingsEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(settingsEvent, onChange);
  };
}

function getThemeSnapshot() {
  return localStorage.getItem("marketai-theme") === "dark" ? "dark" : "light";
}

function getLanguageSnapshot() {
  return localStorage.getItem("marketai-language") || "Русский";
}

export function Footer() {
  const theme = useSyncExternalStore(
    subscribeToSettings,
    getThemeSnapshot,
    () => "light",
  );
  const language = useSyncExternalStore(
    subscribeToSettings,
    getLanguageSnapshot,
    () => "Русский",
  );

  function handleThemeChange(nextTheme: "light" | "dark") {
    localStorage.setItem("marketai-theme", nextTheme);
    window.dispatchEvent(new Event(settingsEvent));
  }

  function handleLanguageChange(nextLanguage: string) {
    localStorage.setItem("marketai-language", nextLanguage);
    window.dispatchEvent(new Event(settingsEvent));
  }

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1.2fr_1fr_1fr_1fr] gap-8 px-8 py-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6D4AFF] text-white">
              <Bot size={22} />
            </span>
            <span className="text-2xl font-bold tracking-tight">
              Market<span className="text-[#6D4AFF]">AI</span>
            </span>
          </Link>

          <p className="mt-4 max-w-[420px] text-sm leading-6 text-[#6B7280]">
            Маркетплейс с ИИ-помощником для быстрого поиска товаров, сравнения
            и удобных покупок.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">
            Навигация
          </h3>
          <nav className="mt-4 grid gap-3">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[#6B7280] transition hover:text-[#6D4AFF]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">
            Контакты
          </h3>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-[#6B7280]">
            <span className="flex items-center gap-3">
              <Phone size={17} className="text-[#6D4AFF]" />
              +7 900 000-00-00
            </span>
            <span className="flex items-center gap-3">
              <Mail size={17} className="text-[#6D4AFF]" />
              hello@marketai.local
            </span>
            <span className="flex items-center gap-3">
              <MapPin size={17} className="text-[#6D4AFF]" />
              Екатеринбург
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">
            Настройки
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#6B7280]">Тема</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F6F7FB] p-1">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                    theme === "light"
                      ? "theme-toggle-active"
                      : "text-[#6B7280] hover:text-[#6D4AFF]"
                  }`}
                >
                  <Sun size={16} />
                  Светлая
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${
                    theme === "dark"
                      ? "theme-toggle-active"
                      : "text-[#6B7280] hover:text-[#6D4AFF]"
                  }`}
                >
                  <Moon size={16} />
                  Темная
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                <Languages size={16} className="text-[#6D4AFF]" />
                Язык
              </span>
              <select
                value={language}
                onChange={(event) => handleLanguageChange(event.target.value)}
                className="h-11 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm font-bold text-[#111827] outline-none transition focus:border-[#6D4AFF] focus:bg-white"
              >
                <option>Русский</option>
                <option>English</option>
                <option>Қазақша</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB]">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-8 text-sm text-[#6B7280]">
          <span>© 2026 MarketAI</span>
          <span className="flex items-center gap-2">
            Сделано для удобных покупок <Heart size={15} className="text-[#EF4444]" />
          </span>
        </div>
      </div>
    </footer>
  );
}
