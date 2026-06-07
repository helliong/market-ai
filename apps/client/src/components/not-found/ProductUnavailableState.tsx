import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { categories } from "@/data/categories";

type ProductUnavailableStateProps = {
  categoryId?: number;
};

export function ProductUnavailableState({
  categoryId,
}: ProductUnavailableStateProps) {
  const category = categories.find((item) => item.id === categoryId);
  const catalogHref = category
    ? `/catalog?category=${category.id}`
    : "/catalog";

  return (
    <section className="mx-auto flex min-h-[68vh] max-w-[960px] items-center px-4 py-10 md:px-8">
      <div className="w-full rounded-[32px] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F1EDFF] text-[#6D4AFF]">
          <Search size={30} />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#111827] md:text-5xl">
          Товар не найден
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-base font-semibold leading-7 text-[#6B7280]">
          Мы не смогли найти такой товар. Возможно, его уже купили, сняли с
          продажи или скрыли из витрины. В каталоге есть похожие варианты.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={catalogHref}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-5 text-sm font-black text-white transition hover:bg-[#4F32D9]"
          >
            {category ? "Похожие товары" : "В каталог"}
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6F7FB] px-5 text-sm font-black text-[#111827] transition hover:text-[#6D4AFF]"
          >
            <ArrowLeft size={18} />
            На главную
          </Link>
        </div>
      </div>
    </section>
  );
}
