import { categories } from "@/data/categories";

export function CategoryGrid() {
  return (
    <section className="mx-auto mt-10 max-w-[1440px] px-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-[-0.03em]">
            Популярные категории
          </h2>
          <p className="mt-2 text-[#6B7280]">
            Быстрый переход к основным разделам маркетплейса
          </p>
        </div>

        <button className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          Все категории
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <div
              key={category.id}
              className="group rounded-[24px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(109,74,255,0.14)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF] transition group-hover:bg-[#6D4AFF] group-hover:text-white">
                <Icon size={26} />
              </div>

              <h3 className="mt-5 text-lg font-bold">{category.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280]">Смотреть товары</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}