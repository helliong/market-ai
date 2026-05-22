import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

export function ProductSection() {
  return (
    <section className="mx-auto mt-12 max-w-[1440px] px-4 pb-16 md:px-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">
            Популярные товары
          </h2>
          <p className="mt-2 text-[#6B7280]">
            Подборка товаров с высоким рейтингом и выгодными ценами
          </p>
        </div>

        <Link
          href="/catalog"
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
        >
          Смотреть все
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
