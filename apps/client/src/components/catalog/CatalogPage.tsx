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
import {
  type FilterState,
  DEFAULT_FILTERS,
  getFilteredProducts,
  extractDynamicFilters,
} from "./useSmartFilters";

type CatalogPageProps = {
  initialCategory?: number | "all";
  initialQuery?: string;
  initialSubcategory?: string;
  initialProducts?: ClientProduct[];
};

type SortMode = "popular" | "rating" | "priceAsc" | "priceDesc";

// Экран каталога управляет категориями, поиском, фильтрами, сортировкой и списком товаров.

function FilterAccordion({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E5E7EB] py-4 last:border-0 dark:border-[#334155]">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex w-full items-center justify-between text-sm font-black text-[var(--text-main)]"
      >
        {title}
        <ChevronDown size={16} className={`transition-transform text-[#64748B] ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

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

  const [draftFilters, setDraftFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [brandSearch, setBrandSearch] = useState("");

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
                checkSmartSubcategory(product, initialSubcategory, isSubcategoryPage) &&
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
                checkSmartSubcategory(product, initialSubcategory, isSubcategoryPage) &&
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

  const dynamicFilters = useMemo(
    () => extractDynamicFilters(visibleProducts),
    [visibleProducts]
  );

  const hasDraftChanges = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);
  }, [draftFilters, appliedFilters]);

  const draftFilteredProducts = useMemo(() => {
    const filtered = getFilteredProducts(
      visibleProducts,
      draftFilters,
      searchQuery,
      selectedCategory,
      initialSubcategory,
      isSubcategoryPage,
      usesServerSearch,
      checkSmartSubcategory,
      getProductBrand
    );
    return [...filtered].sort((left, right) => {
      if (sort === "rating") return right.rating - left.rating;
      if (sort === "priceAsc") return parseProductPrice(left.price) - parseProductPrice(right.price);
      if (sort === "priceDesc") return parseProductPrice(right.price) - parseProductPrice(left.price);
      return right.reviews - left.reviews;
    });
  }, [
    visibleProducts,
    draftFilters,
    searchQuery,
    selectedCategory,
    initialSubcategory,
    isSubcategoryPage,
    usesServerSearch,
    sort,
  ]);

  const filteredProducts = useMemo(() => {
    const filtered = getFilteredProducts(
      visibleProducts,
      appliedFilters,
      searchQuery,
      selectedCategory,
      initialSubcategory,
      isSubcategoryPage,
      usesServerSearch,
      checkSmartSubcategory,
      getProductBrand
    );
    return [...filtered].sort((left, right) => {
      if (sort === "rating") return right.rating - left.rating;
      if (sort === "priceAsc") return parseProductPrice(left.price) - parseProductPrice(right.price);
      if (sort === "priceDesc") return parseProductPrice(right.price) - parseProductPrice(left.price);
      return right.reviews - left.reviews;
    });
  }, [
    visibleProducts,
    appliedFilters,
    searchQuery,
    selectedCategory,
    initialSubcategory,
    isSubcategoryPage,
    usesServerSearch,
    sort,
  ]);

  function handleQuickPick(pick: string) {
    const priceLimit = getQuickPickPriceLimit(pick);

    if (priceLimit !== null) {
      const newFilters = { ...draftFilters, maxPrice: String(priceLimit) };
      setDraftFilters(newFilters);
      setAppliedFilters(newFilters);
      return;
    }

    setSearchQuery(pick === "Все подборки" ? "" : pick);
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setBrandSearch("");
    setSort("popular");
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
  }

  function toggleStore(store: string) {
    setDraftFilters((prev) => ({
      ...prev,
      selectedStores: prev.selectedStores.includes(store)
        ? prev.selectedStores.filter((s) => s !== store)
        : [...prev.selectedStores, store],
    }));
  }

  function toggleBrand(brand: string) {
    setDraftFilters((prev) => ({
      ...prev,
      selectedBrands: prev.selectedBrands.includes(brand)
        ? prev.selectedBrands.filter((b) => b !== brand)
        : [...prev.selectedBrands, brand],
    }));
  }
  
  function toggleDynamicFilter(attrKey: string, value: string) {
    setDraftFilters((prev) => {
      const currentValues = prev.dynamicAttributes[attrKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        dynamicAttributes: {
          ...prev.dynamicAttributes,
          [attrKey]: newValues,
        }
      };
    });
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
          <aside className="h-fit rounded-[24px] bg-white dark:bg-[#0F172A] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] xl:sticky xl:top-[92px]">
            <h2 className="text-base font-black text-[var(--text-main)]">
              Фильтры
            </h2>
            <div className="mt-5 space-y-5">
              <ToggleRow
                label="Скидки недели"
                checked={draftFilters.onlyDiscounts}
                onChange={(checked) => setDraftFilters(prev => ({ ...prev, onlyDiscounts: checked }))}
              />
              <ToggleRow
                label="Быстрая доставка"
                checked={draftFilters.fastDelivery}
                onChange={(checked) => setDraftFilters(prev => ({ ...prev, fastDelivery: checked }))}
              />
              <FilterAccordion title="Цена" defaultOpen>
                <div className="grid grid-cols-2 gap-2">
                  <PriceInput
                    value={draftFilters.minPrice}
                    onChange={(val) => setDraftFilters(prev => ({ ...prev, minPrice: val }))}
                    placeholder="от 0"
                    ariaLabel="Минимальная цена"
                  />
                  <PriceInput
                    value={draftFilters.maxPrice}
                    onChange={(val) => setDraftFilters(prev => ({ ...prev, maxPrice: val }))}
                    placeholder="до 100 000"
                    ariaLabel="Максимальная цена"
                  />
                </div>
              </FilterAccordion>
              
              <FilterAccordion title="Бренд" defaultOpen>
                <input
                  type="search"
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  placeholder="Найти бренд"
                  aria-label="Поиск по бренду"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-transparent px-3 py-2 text-sm font-semibold text-[var(--text-main)] outline-none transition placeholder:text-[#64748B] focus:border-[#6D4AFF] dark:border-[#334155]"
                />
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {visibleBrands.map((brand) => (
                    <FilterCheckbox
                      key={brand}
                      label={brand}
                      checked={draftFilters.selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                  ))}
                  {visibleBrands.length === 0 && (
                    <p className="text-xs font-semibold text-[#64748B]">
                      Бренды не найдены
                    </p>
                  )}
                </div>
              </FilterAccordion>
              
              <FilterAccordion title="Магазин">
                <div className="space-y-2">
                  {availableStores.slice(0, 6).map((store) => (
                    <FilterCheckbox
                      key={store}
                      label={store}
                      checked={draftFilters.selectedStores.includes(store)}
                      onChange={() => toggleStore(store)}
                    />
                  ))}
                </div>
              </FilterAccordion>
              
              {dynamicFilters.map((filter) => (
                <FilterAccordion key={filter.key} title={filter.key}>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {filter.values.map((value) => (
                      <FilterCheckbox
                        key={value}
                        label={value}
                        checked={(draftFilters.dynamicAttributes[filter.key] || []).includes(value)}
                        onChange={() => toggleDynamicFilter(filter.key, value)}
                      />
                    ))}
                  </div>
                </FilterAccordion>
              ))}
              
              <FilterAccordion title="Рейтинг товара">
                <div className="space-y-2">
                  {[0, 4, 4.5].map((rating) => (
                    <label key={rating} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rating"
                        className="h-4 w-4 accent-[#6D4AFF]"
                        checked={draftFilters.rating === rating}
                        onChange={() => setDraftFilters(prev => ({ ...prev, rating }))}
                      />
                      <span className="text-sm font-semibold text-[var(--text-main)]">
                        {rating === 0 ? "Любой" : rating === 4 ? "4.0 и выше" : "4.5 и выше"}
                      </span>
                    </label>
                  ))}
                </div>
              </FilterAccordion>

              <div className="sticky bottom-0 pb-2 bg-white dark:bg-[#0F172A] z-10 flex flex-col gap-2">
                {hasDraftChanges && (
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="w-full rounded-xl bg-[#6D4AFF] px-3 py-3 text-sm font-black text-white transition hover:bg-[#4F32D9] shadow-lg shadow-[#6D4AFF]/30"
                  >
                    Показать ({draftFilteredProducts.length})
                  </button>
                )}
                {(draftFilters.onlyDiscounts ||
                  draftFilters.fastDelivery ||
                  draftFilters.minPrice ||
                  draftFilters.maxPrice ||
                  draftFilters.selectedBrands.length > 0 ||
                  draftFilters.selectedStores.length > 0 ||
                  draftFilters.rating > 0 ||
                  Object.values(draftFilters.dynamicAttributes).some(arr => arr.length > 0)) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-full rounded-xl border border-[#6D4AFF] px-3 py-2 text-sm font-black text-[#6D4AFF] transition hover:bg-[#F1EDFF]"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
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

function checkSmartSubcategory(product: ClientProduct, subcategory: string, isSubcategoryPage: boolean) {
  if (!isSubcategoryPage) return true;
  
  const normalizedSubcategory = subcategory.trim().toLowerCase();
  const productCategory = product.category?.toLowerCase() || "";

  if (normalizedSubcategory === "игровые ноутбуки") {
    if (productCategory.includes("ноутбук")) {
      const attrs = JSON.stringify(product.attributes).toLowerCase();
      const title = product.title.toLowerCase();
      if (attrs.includes("игров") || title.includes("игров") || attrs.includes("gaming") || title.includes("gaming") || title.includes("legion") || title.includes("rog") || title.includes("tuf") || title.includes("nitro")) {
        return true;
      }
    }
  }

  if (normalizedSubcategory === "беспроводные наушники" || normalizedSubcategory === "беспроводные") {
    if (productCategory.includes("наушник")) {
      const attrs = JSON.stringify(product.attributes).toLowerCase();
      const title = product.title.toLowerCase();
      if (attrs.includes("беспроводн") || attrs.includes("bluetooth") || attrs.includes("tws") || title.includes("tws") || title.includes("wireless") || title.includes("bluetooth") || title.includes("беспроводн")) {
        return true;
      }
    }
  }

  return productCategory === normalizedSubcategory;
}
