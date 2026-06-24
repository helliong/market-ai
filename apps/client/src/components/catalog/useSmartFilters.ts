import { useMemo, useState } from "react";
import type { ClientProduct } from "@/lib/catalog-products";
import { getProductBrand } from "./CatalogPage"; // need to extract this or export it

export type FilterState = {
  onlyDiscounts: boolean;
  fastDelivery: boolean;
  minPrice: string;
  maxPrice: string;
  selectedBrands: string[];
  selectedStores: string[];
  rating: number;
  dynamicAttributes: Record<string, string[]>;
};

export const DEFAULT_FILTERS: FilterState = {
  onlyDiscounts: false,
  fastDelivery: false,
  minPrice: "",
  maxPrice: "",
  selectedBrands: [],
  selectedStores: [],
  rating: 0,
  dynamicAttributes: {},
};

function parseFilterPrice(price: string) {
  const normalizedPrice = price.replace(/[^\d]/g, "");
  return normalizedPrice ? Number(normalizedPrice) : null;
}

function parseProductPrice(price: string) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function hasFastDelivery(product: ClientProduct) {
  return Object.entries(product.attributes).some(([key, value]) => {
    const normalizedAttribute = `${key} ${value}`.toLowerCase();
    return (
      normalizedAttribute.includes("доставка завтра") ||
      normalizedAttribute.includes("экспресс") ||
      normalizedAttribute.includes("fast delivery")
    );
  });
}

// Вычисляем товары по примененным фильтрам
export function getFilteredProducts(
  products: ClientProduct[],
  filters: FilterState,
  searchQuery: string,
  selectedCategory: number | "all",
  initialSubcategory: string,
  isSubcategoryPage: boolean,
  usesServerSearch: boolean,
  checkSmartSubcategory: (p: ClientProduct, sub: string, isSub: boolean) => boolean,
  getProductBrand: (p: ClientProduct) => string | undefined,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedMinPrice = parseFilterPrice(filters.minPrice);
  const normalizedMaxPrice = parseFilterPrice(filters.maxPrice);

  return products.filter((product) => {
    const productPrice = parseProductPrice(product.price);
    const matchesCategory =
      selectedCategory === "all" || product.categoryIds.includes(selectedCategory);
    const matchesSubcategory = checkSmartSubcategory(product, initialSubcategory, isSubcategoryPage);
    const matchesSearch =
      usesServerSearch ||
      !normalizedQuery ||
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.storeName?.toLowerCase().includes(normalizedQuery) ||
      product.badge?.toLowerCase().includes(normalizedQuery) ||
      product.category?.toLowerCase().includes(normalizedQuery);
    
    const matchesDiscount = !filters.onlyDiscounts || Boolean(product.oldPrice);
    const matchesDelivery = !filters.fastDelivery || hasFastDelivery(product);
    const matchesMinPrice = normalizedMinPrice === null || productPrice >= normalizedMinPrice;
    const matchesMaxPrice = normalizedMaxPrice === null || productPrice <= normalizedMaxPrice;
    const matchesStore =
      filters.selectedStores.length === 0 ||
      (product.storeName ? filters.selectedStores.includes(product.storeName) : false);
    
    const productBrand = getProductBrand(product);
    const matchesBrand =
      filters.selectedBrands.length === 0 ||
      (productBrand ? filters.selectedBrands.includes(productBrand) : false);
      
    const matchesRating = product.rating >= filters.rating;

    // Проверяем динамические атрибуты
    const matchesDynamicAttrs = Object.entries(filters.dynamicAttributes).every(([attrKey, selectedValues]) => {
      if (selectedValues.length === 0) return true;
      const productAttrValue = product.attributes[attrKey];
      if (!productAttrValue) return false;
      return selectedValues.includes(productAttrValue);
    });

    return (
      matchesCategory &&
      matchesSubcategory &&
      matchesSearch &&
      matchesDiscount &&
      matchesDelivery &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesBrand &&
      matchesStore &&
      matchesRating &&
      matchesDynamicAttrs
    );
  });
}

// Генерация динамических фильтров
export type DynamicFilter = {
  key: string;
  values: string[];
};

export function extractDynamicFilters(products: ClientProduct[]): DynamicFilter[] {
  const attributeCounts: Record<string, Set<string>> = {};
  
  products.forEach(product => {
    Object.entries(product.attributes).forEach(([key, value]) => {
      // Игнорируем длинные описательные характеристики
      if (value.length > 30) return;
      if (key.toLowerCase() === "бренд") return;

      if (!attributeCounts[key]) {
        attributeCounts[key] = new Set();
      }
      attributeCounts[key].add(value);
    });
  });

  const validFilters: DynamicFilter[] = [];
  const minProductsThreshold = Math.max(2, Math.floor(products.length * 0.15)); // хотя бы у 15% товаров должно быть свойство

  for (const [key, valuesSet] of Object.entries(attributeCounts)) {
    const values = Array.from(valuesSet);
    // Фильтр имеет смысл, если у него от 2 до 12 уникальных значений
    if (values.length >= 2 && values.length <= 12) {
      // Проверяем, сколько товаров реально имеют это свойство
      const productsWithAttr = products.filter(p => p.attributes[key]).length;
      if (productsWithAttr >= minProductsThreshold) {
        validFilters.push({
          key,
          values: values.sort((a, b) => a.localeCompare(b, "ru", { numeric: true })),
        });
      }
    }
  }

  // Оставляем топ-5 фильтров (с наименьшим числом вариантов для простоты)
  return validFilters.sort((a, b) => a.values.length - b.values.length).slice(0, 5);
}
