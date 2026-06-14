"use client";

import { Bot, MessageCircle, RotateCcw, Send, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  sendAiMessage,
  type AiChatMessage,
  type AiProduct,
} from "@/lib/ai-api";
import { getMainProductImageUrl } from "@/lib/product-image";
import { getProductPath } from "@/lib/product-url";

type WidgetMessage = AiChatMessage & {
  id: string;
  products?: AiProduct[];
  isError?: boolean;
};

const SUGGESTIONS = [
  "Ноутбук для программирования",
  "Смартфон до 50 000 ₽",
  "Умные часы для спорта",
  "Подарок до 3000 ₽",
  "Беспроводные наушники",
  "Кофемашина для дома",
];

export function AIWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);
  const [isDraggingSuggestions, setIsDraggingSuggestions] = useState(false);

  useEffect(() => {
    const openWidget = () => setIsOpen(true);
    window.addEventListener("open-ai-widget", openWidget);
    return () => window.removeEventListener("open-ai-widget", openWidget);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, isLoading, messages]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  async function submitMessage(message: string) {
    const normalizedMessage = message.trim();
    if (!normalizedMessage || isLoading) return;

    const history = messages.map(({ role, content, products }) => ({
      role,
      content: products?.length
        ? `${content}\n\n${buildProductsContext(products)}`
        : content,
    }));
    const userMessage: WidgetMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: normalizedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendAiMessage(normalizedMessage, history);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          products: response.products,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Не удалось получить ответ помощника.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  function handleSuggestionsPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const container = suggestionsRef.current;
    if (!container) return;

    dragStartXRef.current = event.clientX;
    dragScrollLeftRef.current = container.scrollLeft;
    didDragRef.current = false;
    setIsDraggingSuggestions(true);
  }

  function handleSuggestionsPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const container = suggestionsRef.current;
    if (!container || !isDraggingSuggestions) return;

    const distance = event.clientX - dragStartXRef.current;
    if (Math.abs(distance) > 5) {
      didDragRef.current = true;
    }

    container.scrollLeft = dragScrollLeftRef.current - distance;
  }

  function handleSuggestionsPointerUp() {
    setIsDraggingSuggestions(false);
  }

  if (pathname.startsWith("/checkout")) return null;

  const hasConversation = messages.length > 0;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Закрыть помощника"
          className="fixed inset-0 z-[60] cursor-default bg-[#050816]/70 backdrop-blur-[3px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <section
          aria-label="ИИ-помощник MarketAI"
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#0F172A] text-white shadow-[0_24px_80px_rgba(15,23,42,0.55)] sm:inset-y-[30px] sm:left-auto sm:right-2 sm:w-[545px] sm:rounded-[36px]"
        >
          <div className="flex h-20 shrink-0 items-center gap-3 px-7">
            {hasConversation && (
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6D4AFF] text-white">
                  <Bot size={21} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-black text-white">Марк</h2>
                  <p className="truncate text-xs text-[#94A3B8]">
                    ИИ-помощник MarketAI
                  </p>
                </div>
              </div>
            )}
            {!hasConversation && <div className="flex-1" />}
            {hasConversation && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setInput("");
                }}
                className="rounded-full p-2 text-[#94A3B8] transition hover:bg-white/5 hover:text-white"
                aria-label="Очистить чат"
                title="Очистить чат"
              >
                <RotateCcw size={19} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-[#CBD5E1] transition hover:bg-white/5 hover:text-white"
              aria-label="Закрыть помощника"
            >
              <X size={24} />
            </button>
          </div>

          {hasConversation ? (
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onProductClick={() => setIsOpen(false)}
                  />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 sm:px-7">
              <div className="flex flex-1 flex-col items-center pt-16 text-center sm:pt-14">
                <div className="flex h-[86px] w-[86px] items-center justify-center rounded-[30px] bg-gradient-to-br from-[#6D4AFF] to-[#5934E8] text-white shadow-[0_18px_45px_rgba(89,52,232,0.3)]">
                  <Bot size={43} strokeWidth={2.4} />
                </div>
                <h2 className="mt-7 text-2xl font-black tracking-[-0.02em]">
                  Привет, я Марк
                </h2>
                <p className="mt-3 text-base text-[#E2E8F0]">
                  Чем могу помочь?
                </p>
              </div>

              <div className="shrink-0 pb-4">
                <h3 className="mb-3 text-sm font-bold">Рекомендации</h3>
                <div
                  ref={suggestionsRef}
                  onPointerDown={handleSuggestionsPointerDown}
                  onPointerMove={handleSuggestionsPointerMove}
                  onPointerUp={handleSuggestionsPointerUp}
                  onPointerCancel={() => setIsDraggingSuggestions(false)}
                  className="overflow-x-auto pb-1 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ cursor: isDraggingSuggestions ? "grabbing" : "grab" }}
                >
                  <div className="flex w-max flex-col gap-2">
                    <div className="flex gap-2">
                      {SUGGESTIONS.slice(0, 3).map((suggestion) => (
                        <Suggestion
                          key={suggestion}
                          text={suggestion}
                          onClick={() => {
                            if (!didDragRef.current) {
                              void submitMessage(suggestion);
                            }
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {SUGGESTIONS.slice(3).map((suggestion) => (
                        <Suggestion
                          key={suggestion}
                          text={suggestion}
                          onClick={() => {
                            if (!didDragRef.current) {
                              void submitMessage(suggestion);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-[#26344A] bg-[#0F172A] px-5 py-5 sm:px-7"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[#334155] bg-[#111C31] p-2.5 pl-5 focus-within:border-[#6D4AFF]">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={4000}
                placeholder="Например: ноутбук для учёбы..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#94A3B8]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#6D4AFF] text-white transition hover:bg-[#7C5CFF] disabled:opacity-40"
                aria-label="Отправить"
              >
                <Send size={21} />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-[#64748B]">
              Марк — ИИ-помощник. Ответы могут быть неточными.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${isOpen ? "hidden" : "flex"} fixed bottom-25 right-5 z-50 h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-[#6D4AFF] to-[#4F32D9] text-white shadow-[0_18px_50px_rgba(79,50,217,0.32)] transition hover:scale-105 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16`}
        aria-label="Открыть ИИ-помощника"
      >
        <MessageCircle size={28} />
      </button>
    </>
  );
}

function Suggestion({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="whitespace-nowrap rounded-xl border border-[#334155] bg-[#111C31] px-4 py-2.5 text-sm text-white transition hover:border-[#6D4AFF] hover:bg-[#18243B]"
    >
      {text}
    </button>
  );
}

function ChatMessage({
  message,
  onProductClick,
}: {
  message: WidgetMessage;
  onProductClick: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <AssistantAvatar />}
      <div className="max-w-[84%]">
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
            isUser
              ? "rounded-br-md bg-[#6D4AFF] text-white"
              : message.isError
                ? "rounded-bl-md border border-red-400/40 bg-red-950/40 text-red-200"
                : "rounded-bl-md border border-[#26344A] bg-[#111C31] text-[#F8FAFC]"
          }`}
        >
          {message.content}
        </div>
        {message.products && message.products.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {message.products.map((product) => (
              <ProductResult
                key={product.id}
                product={product}
                onClick={onProductClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#6D4AFF] text-white">
      <Sparkles size={16} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <AssistantAvatar />
      <div className="flex gap-1 rounded-2xl rounded-bl-md border border-[#26344A] bg-[#111C31] px-4 py-3">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="h-2 w-2 animate-bounce rounded-full bg-[#8B72FF]"
            style={{ animationDelay: `${dot * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ProductResult({
  product,
  onClick,
}: {
  product: AiProduct;
  onClick: () => void;
}) {
  const imageUrl = getMainProductImageUrl(product.images);
  const href = getProductPath({
    sku: product.sku,
    title: product.name,
    category: product.category,
  });

  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex gap-3 rounded-2xl border border-[#334155] bg-[#111C31] p-3 transition hover:border-[#6D4AFF]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#18243B]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized
            sizes="64px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#94A3B8]">
            <Sparkles size={20} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-xs font-bold text-white">
          {product.name}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-black text-[#A78BFA]">
            {new Intl.NumberFormat("ru-RU").format(product.price)} ₽
          </span>
          <span className="text-xs text-[#CBD5E1]">
            ★ {product.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function buildProductsContext(products: AiProduct[]) {
  return `Контекст показанных товаров: ${products
    .map(
      (product, index) =>
        `${index + 1}) ID ${product.id}, ${product.name}, цена ${product.price} ₽`,
    )
    .join('; ')}. Для подробного сравнения используй эти ID.`;
}
