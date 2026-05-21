"use client";

import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div
          className="fixed bottom-28 right-8 z-50 w-[380px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(79,50,217,0.25)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-[#6D4AFF] to-[#4F32D9] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Bot size={24} />
              </div>

              <div>
                <h3 className="font-black">MarketAI Assistant</h3>
                <p className="text-xs text-white/75">Помогу выбрать товар</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 transition hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-2xl bg-[#F6F7FB] p-4 text-sm leading-6 text-[#111827]">
              Привет! Опиши, что хочешь купить, а я подберу подходящие товары.
            </div>

            <div className="grid gap-2">
              {[
                "Ноутбук для программирования",
                "Смартфон до 50 000 ₽",
                "Подарок до 3000 ₽",
              ].map((item) => (
                <button
                  key={item}
                  className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] p-3 text-left text-sm font-medium transition hover:border-[#6D4AFF] hover:bg-[#F1EDFF]"
                >
                  <Sparkles size={16} className="text-[#6D4AFF]" />
                  {item}
                </button>
              ))}
            </div>

            <div className="flex gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-2">
              <input
                placeholder="Например: ноутбук для учёбы..."
                className="flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D4AFF] text-white">
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white shadow-[0_18px_50px_rgba(79,50,217,0.32)] transition hover:scale-105"
      >
        <MessageCircle size={28} />
      </button>
    </>
  );
}
