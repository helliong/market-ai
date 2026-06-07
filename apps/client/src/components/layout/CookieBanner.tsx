"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    console.log("Cookie consent value in storage:", consent);
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    console.log("CookieBanner: Not visible");
    return null;
  }

  console.log("CookieBanner: Visible!");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom-5">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl p-5 pr-12 md:p-6 md:pr-16 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5 dark:ring-white/10 relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-colors duration-300">
        <div className="flex items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white shadow-lg shadow-indigo-500/30">
            <Info size={24} />
          </div>
          <div>
            <p className="text-base font-black tracking-tight text-gray-900 dark:text-white">
              Мы используем файлы cookie
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Продолжая использовать сайт, вы соглашаетесь с нашей политикой
              использования cookie-файлов для улучшения пользовательского
              опыта.
            </p>
          </div>
        </div>
        <button
          onClick={handleAccept}
          className="shrink-0 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 px-8 py-3 text-sm font-bold text-white dark:text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-black/10 dark:shadow-white/10"
        >
          Принять
        </button>
        <button
          onClick={handleAccept}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white sm:top-1/2 sm:-translate-y-1/2"
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
