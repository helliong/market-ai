"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { categories } from "@/data/categories";
import { ProductCard } from "@/components/ui/ProductCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { getCatalogQuickPicks, getCatalogSections } from "@/lib/catalog-data";
import { getCatalogSlug } from "@/lib/catalog-slug";
import {
  searchCatalogProducts,
  type ClientProduct,
} from "@/lib/catalog-products";

type CatalogPageProps = {
  initialCategory?: number | "all";
  initialQuery?: string;
  initialSubcategory?: string;
  initialProducts?: ClientProduct[];
};

type SortMode = "popular" | "rating" | "priceAsc" | "priceDesc";

// Экран каталога управляет категориями, поиском, фильтрами, сортировкой и списком товаров.
export function CatalogPage({
  initialCategory = "all",
  initialQuery = "",
  initialSubcategory = "",
  initialProducts = [],
}: CatalogPageProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<number | "all">(
    initialCategory,
  );
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortMode>("popular");
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [fastDelivery, setFastDelivery] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [searchProducts, setSearchProducts] =
    useState<ClientProduct[]>(initialProducts);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const products = useCatalogProducts(initialProducts);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setHoveredCategory(null);
  }, [initialCategory]);

  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const hasSearch = Boolean(searchQuery.trim());
  const isSubcategoryPage = Boolean(initialSubcategory);
  const usesServerSearch = hasSearch && !isSubcategoryPage;
  const visibleProducts = usesServerSearch ? searchProducts : products;
  const shouldShowProducts = hasSearch || isSubcategoryPage;
  const activeCategoryId =
    hoveredCategory ?? (selectedCategory === "all" ? categories[0]?.id : selectedCategory);
  const activeCategory = categories.find((category) => category.id === activeCategoryId);
  const activeSections = getCatalogSections(activeCategoryId);
  const quickPicks = getCatalogQuickPicks(initialSubcategory);
  const availableStores = useMemo(
    () =>
      Array.from(
        new Set(
          visibleProducts
            .filter(
              (product) =>
                (!isSubcategoryPage ||
                  product.category?.toLowerCase() ===
                    initialSubcategory.toLowerCase()) &&
                (selectedCategory === "all" ||
                  product.categoryIds.includes(selectedCategory)),
            )
            .map((product) => product.storeName)
            .filter((store): store is string => Boolean(store)),
        ),
      ).sort((left, right) => left.localeCompare(right, "ru")),
    [
      initialSubcategory,
      isSubcategoryPage,
      selectedCategory,
      visibleProducts,
    ],
  );
  const availableBrands = useMemo(
    () =>
      Array.from(
        new Set(
          visibleProducts
            .filter(
              (product) =>
                (!isSubcategoryPage ||
                  product.category?.toLowerCase() ===
                    initialSubcategory.toLowerCase()) &&
                (selectedCategory === "all" ||
                  product.categoryIds.includes(selectedCategory)),
            )
            .map(getProductBrand)
            .filter((brand): brand is string => Boolean(brand)),
        ),
      ).sort((left, right) => left.localeCompare(right, "ru")),
    [
      initialSubcategory,
      isSubcategoryPage,
      selectedCategory,
      visibleProducts,
    ],
  );
  const visibleBrands = useMemo(() => {
    const normalizedSearch = brandSearch.trim().toLowerCase();

    return availableBrands
      .filter(
        (brand) =>
          !normalizedSearch || brand.toLowerCase().includes(normalizedSearch),
      )
      .slice(0, 8);
  }, [availableBrands, brandSearch]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedMinPrice = parseFilterPrice(minPrice);
    const normalizedMaxPrice = parseFilterPrice(maxPrice);
    const filtered = visibleProducts.filter((product) => {
      const productPrice = parseProductPrice(product.price);
      const matchesCategory =
        selectedCategory === "all" ||
        product.categoryIds.includes(selectedCategory);
      const matchesSubcategory = 
        !isSubcategoryPage || 
        product.category?.toLowerCase() === initialSubcategory.toLowerCase();
      const matchesSearch =
        usesServerSearch ||
        !normalizedQuery ||
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.storeName?.toLowerCase().includes(normalizedQuery) ||
        product.badge?.toLowerCase().includes(normalizedQuery) ||
        product.category?.toLowerCase().includes(normalizedQuery);
      const matchesDiscount = !onlyDiscounts || Boolean(product.oldPrice);
      const matchesDelivery = !fastDelivery || hasFastDelivery(product);
      const matchesMinPrice =
        normalizedMinPrice === null || productPrice >= normalizedMinPrice;
      const matchesMaxPrice =
        normalizedMaxPrice === null || productPrice <= normalizedMaxPrice;
      const matchesStore =
        selectedStores.length === 0 ||
        (product.storeName ? selectedStores.includes(product.storeName) : false);
      const productBrand = getProductBrand(product);
      const matchesBrand =
        selectedBrands.length === 0 ||
        (productBrand ? selectedBrands.includes(productBrand) : false);

      return (
        matchesCategory &&
        matchesSubcategory &&
        matchesSearch &&
        matchesDiscount &&
        matchesDelivery &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesBrand &&
        matchesStore
      );
    });

    return [...filtered].sort((left, right) => {
      if (sort === "rating") return right.rating - left.rating;
      if (sort === "priceAsc") return parseProductPrice(left.price) - parseProductPrice(right.price);
      if (sort === "priceDesc") return parseProductPrice(right.price) - parseProductPrice(left.price);
      return right.reviews - left.reviews;
    });
  }, [
    fastDelivery,
    initialSubcategory,
    isSubcategoryPage,
    maxPrice,
    minPrice,
    onlyDiscounts,
    searchQuery,
    selectedCategory,
    selectedBrands,
    selectedStores,
    sort,
    usesServerSearch,
    visibleProducts,
  ]);

  function handleQuickPick(pick: string) {
    const priceLimit = getQuickPickPriceLimit(pick);

    if (priceLimit !== null) {
      setMaxPrice(String(priceLimit));
      return;
    }

    setSearchQuery(pick === "Все подборки" ? "" : pick);
  }

  function resetFilters() {
    setOnlyDiscounts(false);
    setFastDelivery(false);
    setMinPrice("");
    setMaxPrice("");
    setBrandSearch("");
    setSelectedBrands([]);
    setSelectedStores([]);
    setSort("popular");
  }

  function toggleStore(store: string) {
    setSelectedStores((currentStores) =>
      currentStores.includes(store)
        ? currentStores.filter((currentStore) => currentStore !== store)
        : [...currentStores, store],
    );
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((currentBrands) =>
      currentBrands.includes(brand)
        ? currentBrands.filter((currentBrand) => currentBrand !== brand)
        : [...currentBrands, brand],
    );
  }

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (!normalizedQuery || isSubcategoryPage) {
      setSearchProducts(products);
      setIsSearchLoading(false);
      return;
    }

    let isMounted = true;
    setIsSearchLoading(true);

    const timeoutId = window.setTimeout(() => {
      searchCatalogProducts(normalizedQuery)
        .then((results) => {
          if (isMounted) {
            setSearchProducts(results);
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsSearchLoading(false);
          }
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [isSubcategoryPage, products, searchQuery]);

  if (shouldShowProducts) {
    return (
      <section className="mx-auto max-w-[1440px] px-4 py-5 md:px-8 md:py-7">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-black text-[#64748B]">
            <Link href="/catalog" className="transition hover:text-[#6D4AFF]">
              Каталог
            </Link>
            <span>•</span>
            <Link
              href={`/catalog?category=${activeCategoryId ?? 1}`}
              className="transition hover:text-[#6D4AFF]"
            >
              {activeCategory ? t(activeCategory.title) : "Категории"}
            </Link>
            {isSubcategoryPage && (
              <>
                <span>•</span>
                <span>{initialSubcategory}</span>
              </>
            )}
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)] md:text-5xl">
            {isSubcategoryPage ? initialSubcategory : `“${searchQuery.trim()}”`}
          </h1>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          {quickPicks.map((pick) => (
              <button
                key={pick}
                type="button"
                onClick={() => handleQuickPick(pick)}
                className="rounded-lg bg-[#EEF2F7] px-2.5 py-1.5 text-xs font-black text-[#111827] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF] dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:hover:bg-[#201A3F] dark:hover:text-[#A78BFA]"
              >
                {pick}
              </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] xl:sticky xl:top-[92px]">
            <h2 className="text-base font-black text-[var(--text-main)]">
              Фильтры
            </h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm font-black text-[var(--text-main)]">
                  Категория
                </p>
                <div className="mt-3 space-y-2">
                  <Link
                    href="/catalog?category=1"
                    className="flex items-center gap-2 text-sm font-bold text-[#64748B] transition hover:text-[#6D4AFF]"
                  >
                    <ChevronRight size={15} className="rotate-180" />
                    Электроника
                  </Link>
                  <div className="rounded-2xl bg-[#F6F7FB] px-3 py-2 text-sm font-black text-[var(--text-main)]">
                    {isSubcategoryPage ? initialSubcategory : "Поиск"}
                  </div>
                </div>
              </div>

              <ToggleRow
                label="Скидки недели"
                checked={onlyDiscounts}
                onChange={setOnlyDiscounts}
              />
              <ToggleRow
                label="Быстрая доставка"
                checked={fastDelivery}
                onChange={setFastDelivery}
              />
              <div>
                <p className="text-sm font-black text-[var(--text-main)]">Цена</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PriceInput
                    value={minPrice}
                    onChange={setMinPrice}
                    placeholder="от 0"
                    ariaLabel="Минимальная цена"
                  />
                  <PriceInput
                    value={maxPrice}
                    onChange={setMaxPrice}
                    placeholder="до 100 000"
                    ariaLabel="Максимальная цена"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-main)]">
                  Бренд
                </p>
                <input
                  type="search"
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  placeholder="Найти бренд"
                  aria-label="Поиск по бренду"
                  className="mt-3 w-full rounded-xl border border-[#E5E7EB] bg-transparent px-3 py-2 text-sm font-semibold text-[var(--text-main)] outline-none transition placeholder:text-[#64748B] focus:border-[#6D4AFF] dark:border-[#334155]"
                />
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {visibleBrands.map((brand) => (
                    <FilterCheckbox
                      key={brand}
                      label={brand}
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                  ))}
                  {visibleBrands.length === 0 && (
                    <p className="text-xs font-semibold text-[#64748B]">
                      Бренды не найдены
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-main)]">Магазин</p>
                <div className="mt-3 space-y-2">
                  {availableStores.slice(0, 6).map((store) => (
                    <FilterCheckbox
                      key={store}
                      label={store}
                      checked={selectedStores.includes(store)}
                      onChange={() => toggleStore(store)}
                    />
                  ))}
                </div>
              </div>
              {(onlyDiscounts ||
                fastDelivery ||
                minPrice ||
                maxPrice ||
                selectedBrands.length > 0 ||
                selectedStores.length > 0) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded-xl border border-[#6D4AFF] px-3 py-2 text-sm font-black text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          </aside>

          {isSearchLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[32px] bg-white p-8 text-center font-black text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              Ищем товары...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="min-w-0">
              <div className="mb-4 flex justify-start">
                <label className="inline-flex h-11 w-full items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:w-[230px]">
                  <SlidersHorizontal size={17} className="text-[#6D4AFF]" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    className="w-full bg-transparent outline-none"
                    aria-label="Сортировка каталога"
                  >
                    <option value="popular">Популярные</option>
                    <option value="rating">Высокий рейтинг</option>
                    <option value="priceAsc">Сначала дешевле</option>
                    <option value="priceDesc">Сначала дороже</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <Sparkles size={42} className="text-[#6D4AFF]" />
              <h2 className="mt-4 text-2xl font-black">Ничего не найдено</h2>
              <p className="mt-3 max-w-[420px] text-[#6B7280]">
                Попробуйте изменить запрос или фильтры.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-5 md:px-8 md:py-7">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-[22px] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] lg:sticky lg:top-[92px]">
          <h2 className="px-3 py-3 text-lg font-black text-[var(--text-main)]">
            Категории
          </h2>

          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategoryId === category.id && !hasSearch;

              return (
                <button
                  key={category.id}
                  type="button"
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onFocus={() => setHoveredCategory(category.id)}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSearchQuery("");
                  }}
                  className={`flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition ${
                    isActive
                      ? "bg-[#F1EDFF] text-[#6D4AFF]"
                      : "text-[#111827] hover:bg-[#F6F7FB] hover:text-[#6D4AFF]"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-[#6D4AFF]" : "text-[#CBD5E1]"} />
                  <span className="min-w-0 flex-1 truncate">{t(category.title)}</span>
                  <ChevronRight size={15} className="text-[#CBD5E1]" />
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {!shouldShowProducts && activeCategory && (
            <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-7">
              <div className="mb-6">
                <p className="text-sm font-black text-[#6B7280]">
                  Каталог • {t(activeCategory.title)}
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)] md:text-5xl">
                  {t(activeCategory.title)}
                </h1>
              </div>

              <div className="columns-1 gap-8 sm:columns-2 xl:columns-3">
                {activeSections.map((section) => (
                  <div key={section.title} className="mb-7 break-inside-avoid">
                    <h2 className="text-base font-black text-[var(--text-main)]">
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-2">
                      {section.items.map((item) => (
                        <Link
                          key={item}
                          href={`/catalog/${getCatalogSlug(item)}`}
                          className="block text-left text-sm font-semibold leading-6 text-[#64748B] transition hover:text-[#6D4AFF]"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-black text-[#6D4AFF] transition hover:text-[#4F32D9]"
                    >
                      Еще <ChevronDown size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {shouldShowProducts && (
            <section>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-black text-[#6B7280]">
                    {isSubcategoryPage ? "Электроника" : "Результаты поиска"}
                  </p>
                  <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] text-[var(--text-main)] md:text-5xl">
                    {isSubcategoryPage ? initialSubcategory : `“${searchQuery.trim()}”`}
                  </h1>
                </div>
                <label className="inline-flex h-11 w-full items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:w-[230px]">
                  <SlidersHorizontal size={17} className="text-[#6D4AFF]" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortMode)}
                    className="w-full bg-transparent outline-none"
                    aria-label="Сортировка каталога"
                  >
                    <option value="popular">Популярные</option>
                    <option value="rating">Высокий рейтинг</option>
                    <option value="priceAsc">Сначала дешевле</option>
                    <option value="priceDesc">Сначала дороже</option>
                  </select>
                </label>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                {quickPicks.map((pick) => (
                  <button
                    key={pick}
                    type="button"
                    onClick={() => setSearchQuery(pick === "Все подборки" ? "" : pick)}
                    className="rounded-lg bg-[#EEF2F7] px-2.5 py-1.5 text-xs font-black text-[#111827] transition hover:bg-[#F1EDFF] hover:text-[#6D4AFF] dark:bg-[#1E293B] dark:text-[#F8FAFC] dark:hover:bg-[#201A3F] dark:hover:text-[#A78BFA]"
                  >
                    {pick}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[250px_1fr]">
                <aside className="h-fit rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <h3 className="text-base font-black text-[var(--text-main)]">Фильтры</h3>
                  <div className="mt-5 space-y-5">
                    <ToggleRow
                      label="Скидки недели"
                      checked={onlyDiscounts}
                      onChange={setOnlyDiscounts}
                    />
                    <ToggleRow
                      label="Быстрая доставка"
                      checked={fastDelivery}
                      onChange={setFastDelivery}
                    />
                    <div>
                      <p className="text-sm font-black text-[var(--text-main)]">Цена</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <span className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#64748B]">
                          от 0
                        </span>
                        <span className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm font-semibold text-[#64748B]">
                          до 100 000
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-black text-[var(--text-main)]">Магазин</p>
                      <div className="mt-3 space-y-2">
                        {Array.from(
                          new Set(
                            products
                              .map((product) => product.storeName)
                              .filter((store): store is string => Boolean(store)),
                          ),
                        )
                          .slice(0, 4)
                          .map((store) => (
                            <button
                              key={store}
                              type="button"
                              onClick={() => setSearchQuery(store)}
                              className="flex w-full items-center gap-2 text-left text-sm font-semibold text-[#64748B] transition hover:text-[#6D4AFF]"
                            >
                              <span className="h-4 w-4 rounded-full border border-[#CBD5E1]" />
                              {store}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </aside>

                {isSearchLoading ? (
                  <div className="flex min-h-[360px] items-center justify-center rounded-[32px] bg-white p-8 text-center font-black text-[#6D4AFF] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    Ищем товары...
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[32px] bg-white p-8 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                    <Sparkles size={42} className="text-[#6D4AFF]" />
                    <h2 className="mt-4 text-2xl font-black">Ничего не найдено</h2>
                    <p className="mt-3 max-w-[420px] text-[#6B7280]">
                      Попробуйте изменить запрос, категорию или фильтры.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setSearchQuery("");
                        setOnlyDiscounts(false);
                        setFastDelivery(false);
                        setSort("popular");
                      }}
                      className="mt-6 rounded-2xl bg-[#6D4AFF] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
                    >
                      Сбросить фильтры
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}

// Строка-фильтр с переключателем для боковой панели каталога.
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-black text-[var(--text-main)]">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-[#6D4AFF]" : "bg-[#E5E7EB]"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </label>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-[#64748B] transition hover:text-[#6D4AFF]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 border-[#CBD5E1] bg-white text-white transition group-hover:border-[#8B73FF] peer-checked:border-[#6D4AFF] peer-checked:bg-[#6D4AFF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#6D4AFF]/30 peer-focus-visible:ring-offset-2 dark:border-[#475569] dark:bg-[#0F172A] dark:peer-checked:border-[#7C5CFF] dark:peer-checked:bg-[#7C5CFF] dark:peer-focus-visible:ring-offset-[#0F172A]">
        <Check
          size={13}
          strokeWidth={3}
          className="scale-50 opacity-0 transition group-has-[:checked]:scale-100 group-has-[:checked]:opacity-100"
        />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </label>
  );
}

function PriceInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatPriceInput(value)}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="min-w-0 rounded-xl border border-[#E5E7EB] bg-transparent px-3 py-2 text-sm font-semibold text-[var(--text-main)] outline-none transition placeholder:text-[#64748B] focus:border-[#6D4AFF]"
    />
  );
}

// Преобразует цену товара из строки в число для сортировки по стоимости.
function parseProductPrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function parseFilterPrice(price: string) {
  const normalizedPrice = price.replace(/[^\d]/g, "");
  return normalizedPrice ? Number(normalizedPrice) : null;
}

function formatPriceInput(price: string) {
  const numericPrice = parseFilterPrice(price);
  return numericPrice === null
    ? ""
    : new Intl.NumberFormat("ru-RU").format(numericPrice);
}

function getQuickPickPriceLimit(pick: string) {
  if (!/^до\s/i.test(pick)) {
    return null;
  }

  return parseFilterPrice(pick);
}

function hasFastDelivery(product: ClientProduct) {
  return Object.entries(product.attributes).some(([key, value]) => {
    const normalizedAttribute = `${key} ${value}`.toLowerCase();

    return (
      normalizedAttribute.includes("быстрая доставка") ||
      normalizedAttribute.includes("экспресс-доставка") ||
      normalizedAttribute.includes("доставка за 1 день") ||
      normalizedAttribute.includes("fast delivery") ||
      normalizedAttribute.includes("express delivery")
    );
  });
}

function getProductBrand(product: ClientProduct) {
  const brandAttribute = Object.entries(product.attributes).find(([key]) => {
    const normalizedKey = key.trim().toLowerCase();
    return normalizedKey === "бренд" || normalizedKey === "brand";
  })?.[1];

  if (brandAttribute?.trim() && brandAttribute.trim() !== "—") {
    return brandAttribute.trim();
  }

  const titleWithoutType = product.title.replace(
    /^(?:смарт-часы|смартфон|телефон|ноутбук|планшет|монитор|наушники|мышь|клавиатура|футболка|брюки|шорты|худи|куртка|платье)\s+/i,
    "",
  );
  const inferredBrand = titleWithoutType.split(/\s+/)[0]?.replace(/[,:;]+$/, "");

  return inferredBrand && inferredBrand.length > 1 ? inferredBrand : undefined;
}
