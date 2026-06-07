"use client";

import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { usePathname } from "next/navigation";

// Плавающий AI-виджет для быстрых подсказок по выбору товаров.
export function AIWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoved, setIsMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setIsMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    setTimeout(() => setIsMoved(false), 50);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1; // 1:1 tracking for smoother feel
    if (Math.abs(walk) > 5) setIsMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  useEffect(() => {
    function handleOpenAIWidget() {
      setIsOpen(true);
    }
    window.addEventListener("open-ai-widget", handleOpenAIWidget);
    return () =>
      window.removeEventListener("open-ai-widget", handleOpenAIWidget);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (pathname.startsWith("/checkout")) return null;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] cursor-default bg-[#111827]/35 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}
      {isOpen && (
        <div
          className="fixed inset-4 sm:left-auto z-[70] flex flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_24px_80px_rgba(79,50,217,0.25)] sm:w-[500px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-end p-5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-[#9CA3AF] transition hover:bg-[#F6F7FB] hover:text-[#111827]"
              aria-label={t("closeAssistant")}
            >
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 pb-10">
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white shadow-lg">
                <Bot size={40} />
              </div>
              <h3 className="mt-5 text-xl font-black text-[#111827]">
                Привет, я Марк
              </h3>
              <p className="mt-3 text-base text-[#6B7280]">Чем могу помочь?</p>
            </div>

            <div className="mt-auto min-w-0 w-full">
              <h4 className="mb-3 text-sm font-bold text-[#111827]">
                Рекомендации
              </h4>
              <div
                ref={scrollRef}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
                className="overflow-x-auto pb-2 select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ cursor: isDragging ? "grabbing" : "grab" }}
              >
                <div className="flex w-max flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    {[
                      "Ноутбук для программирования",
                      "Смартфон до 50 000 ₽",
                      "Умные часы для спорта",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`flex items-center whitespace-nowrap rounded-xl border border-[#E5E7EB] px-3.5 py-2 text-sm font-medium transition hover:border-[#6D4AFF] hover:bg-[#F1EDFF] ${isMoved ? "pointer-events-none" : ""}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {[
                      "Подарок до 3000 ₽",
                      "Беспроводные наушники",
                      "Кофемашина для дома",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`flex items-center whitespace-nowrap rounded-xl border border-[#E5E7EB] px-3.5 py-2 text-sm font-medium transition hover:border-[#6D4AFF] hover:bg-[#F1EDFF] ${isMoved ? "pointer-events-none" : ""}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-[#E5E7EB] p-5 bg-white">
            <div className="flex gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-2">
              <input
                placeholder={t("inputPlaceholder")}
                className="flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D4AFF] text-white"
                aria-label={t("send")}
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${isOpen ? "hidden" : "flex"} fixed bottom-25 right-5 z-50 h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white shadow-[0_18px_50px_rgba(79,50,217,0.32)] transition hover:scale-105 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16`}
        aria-label={t("openAssistant")}
      >
        <MessageCircle size={28} />
      </button>
    </>
  );
}
