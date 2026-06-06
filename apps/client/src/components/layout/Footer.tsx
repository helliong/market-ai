"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Bot, Heart, Languages, Mail, MapPin, Moon, Phone, Sun } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAppSelector } from "@/store/hooks";

const footerLinks = [
  { href: "/catalog", key: "catalogLink" },
  { href: "/favorites", key: "favoritesLink" },
  { href: "/compare", key: "compareLink" },
  { href: "/cart", key: "cartLink" },
  { href: "/profile", key: "profileLink" },
  { href: "/agreement", key: "agreement" },
];

const settingsEvent = "marketai-settings";

// Подписывает footer на изменения localStorage, чтобы тема и язык обновлялись без перезагрузки.
function subscribeToSettings(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(settingsEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(settingsEvent, onChange);
  };
}

// Читает текущую тему из localStorage для useSyncExternalStore.
function getThemeSnapshot() {
  return localStorage.getItem("marketai-theme") === "dark" ? "dark" : "light";
}

// Footer показывает навигацию, контакты и переключатели темы/языка.
export function Footer() {
  const { t, lang, changeLanguage } = useLanguage();
  const theme = useSyncExternalStore(subscribeToSettings, getThemeSnapshot, () => "light");
  const user = useAppSelector((state) => state.auth.user);

  function handleThemeChange(nextTheme: "light" | "dark") {
    localStorage.setItem("marketai-theme", nextTheme);
    window.dispatchEvent(new Event(settingsEvent));
  }

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
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
            {t("marketplaceDescription")}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">{t("footerNav")}</h3>
          <nav className="mt-4 grid gap-3">
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={
                  item.href === "/profile" && !user
                    ? "/login?redirect=%2Fprofile"
                    : item.href
                }
                className="text-sm font-semibold text-[#6B7280] transition hover:text-[#6D4AFF]"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">{t("footerContacts")}</h3>
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
          <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#111827]">{t("footerSettings")}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-[#6B7280]">{t("theme")}</p>
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
                  {t("light")}
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
                  {t("dark")}
                </button>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
                <Languages size={16} className="text-[#6D4AFF]" />
                {t("language")}
              </span>
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="h-11 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm font-bold text-[#111827] outline-none transition focus:border-[#6D4AFF] focus:bg-white"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="kk">Қазақша</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB]">
        <div className="mx-auto flex min-h-14 max-w-[1440px] flex-col gap-2 px-4 py-4 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span>{t("copyright")}</span>
          <span className="flex items-center gap-2">
            {t("madeFor")} <Heart size={15} className="text-[#EF4444]" />
          </span>
        </div>
      </div>
    </footer>
  );
}
