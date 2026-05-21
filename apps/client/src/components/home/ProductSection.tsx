import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ui/ProductCard";

export function ProductSection() {
  return (
    <section className="mx-auto mt-12 max-w-[1440px] px-8 pb-16">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.03em]">
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

      <div className="grid grid-cols-4 gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
}
