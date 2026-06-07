import Link from "next/link";
import { Home, Store } from "lucide-react";

export function StoreUnavailableState() {
  return (
    <section className="mx-auto flex min-h-[68vh] max-w-[960px] items-center px-4 py-10 md:px-8">
      <div className="w-full rounded-[32px] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F1EDFF] text-[#6D4AFF]">
          <Store size={30} />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
          Магазин недоступен
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-base font-semibold leading-7 text-[#6B7280]">
          Такого магазина нет на MarketAI или продавец временно скрыл витрину.
          Вернитесь на главную и продолжите покупки.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6D4AFF] px-5 text-sm font-black text-white transition hover:bg-[#4F32D9]"
        >
          <Home size={18} />
          На главную
        </Link>
      </div>
    </section>
  );
}
