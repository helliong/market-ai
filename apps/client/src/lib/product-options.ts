import type { ClientProduct } from "@/lib/catalog-products";
import { getMainProductImageUrl } from "@/lib/product-image";
import { getProductPath } from "@/lib/product-url";

export type ProductColorOption = {
  id: number;
  label: string;
  color: string;
  href: string;
  imageUrl?: string;
  isCurrent: boolean;
};

export type ProductOptions = {
  sizes: string[];
  currentColor?: string;
  colorVariants: ProductColorOption[];
};

const APPAREL_CATEGORY_ID = 3;
const APPAREL_SIZE_SET = ["XS", "S", "M", "L", "XL"];
const EUROPEAN_SIZE_SET = ["38", "39", "40", "41", "42", "43", "44"];

const APPAREL_WORDS = [
  "одеж",
  "футбол",
  "шорт",
  "юбк",
  "брюк",
  "джинс",
  "плать",
  "толстов",
  "худи",
  "рубаш",
  "блуз",
  "куртк",
  "пальто",
  "свитер",
  "костюм",
  "носк",
  "clothing",
  "shirt",
  "shorts",
  "pants",
  "dress",
  "hoodie",
];

const SHOE_WORDS = [
  "обув",
  "кроссов",
  "ботин",
  "туфл",
  "сапог",
  "кед",
  "shoe",
  "sneaker",
  "boot",
];

const COLOR_DEFINITIONS = [
  { labels: ["темно-синие", "темно-синий", "тёмно-синие", "тёмно-синий"], name: "темно-синий", hex: "#172554" },
  { labels: ["темно-зеленые", "темно-зеленый", "тёмно-зеленые", "тёмно-зеленый"], name: "темно-зеленый", hex: "#14532D" },
  { labels: ["белые", "белый", "белая", "белое"], name: "белый", hex: "#F8FAFC" },
  { labels: ["черные", "черный", "черная", "черное", "чёрные", "чёрный", "чёрная", "чёрное"], name: "черный", hex: "#111827" },
  { labels: ["серые", "серый", "серая", "серое"], name: "серый", hex: "#6B7280" },
  { labels: ["синие", "синий", "синяя", "синее"], name: "синий", hex: "#2563EB" },
  { labels: ["зеленые", "зеленый", "зеленая", "зеленое", "зелёные", "зелёный", "зелёная", "зелёное"], name: "зеленый", hex: "#16A34A" },
  { labels: ["красные", "красный", "красная", "красное"], name: "красный", hex: "#DC2626" },
  { labels: ["розовые", "розовый", "розовая", "розовое"], name: "розовый", hex: "#EC4899" },
  { labels: ["бежевые", "бежевый", "бежевая", "бежевое"], name: "бежевый", hex: "#D6C4A5" },
  { labels: ["коричневые", "коричневый", "коричневая", "коричневое"], name: "коричневый", hex: "#92400E" },
];

export function buildProductOptionsMap(products: ClientProduct[]) {
  const groups = new Map<string, ClientProduct[]>();

  for (const product of products) {
    if (!isApparelProduct(product)) {
      continue;
    }

    const key = getVariantGroupKey(product);
    const current = groups.get(key) ?? [];
    current.push(product);
    groups.set(key, current);
  }

  const optionsById = new Map<number, ProductOptions>();

  for (const groupProducts of groups.values()) {
    const colorProducts = groupProducts
      .map((product) => ({ product, color: extractColor(product.title) }))
      .filter((item) => Boolean(item.color));

    for (const product of groupProducts) {
      const currentColor = extractColor(product.title);
      const colorVariants =
        colorProducts.length > 1
          ? colorProducts.map(({ product: variant, color }) => ({
              id: variant.id,
              label: color?.name ?? variant.title,
              color: color?.hex ?? "#CBD5E1",
              href: getProductPath({
                sku: variant.sku,
                title: variant.title,
                category: variant.category ?? "catalog",
              }),
              imageUrl: getMainProductImageUrl(variant.images),
              isCurrent: variant.id === product.id,
            }))
          : [];

      optionsById.set(product.id, {
        sizes: getProductSizes(product),
        currentColor: currentColor?.name,
        colorVariants,
      });
    }
  }

  return optionsById;
}

function isApparelProduct(product: ClientProduct) {
  if (product.categoryIds.includes(APPAREL_CATEGORY_ID)) {
    return true;
  }

  const searchable = normalizeText(`${product.title} ${product.category ?? ""}`);
  return APPAREL_WORDS.some((word) => searchable.includes(word));
}

function getProductSizes(product: ClientProduct) {
  const searchable = normalizeText(`${product.title} ${product.category ?? ""}`);
  return SHOE_WORDS.some((word) => searchable.includes(word))
    ? EUROPEAN_SIZE_SET
    : APPAREL_SIZE_SET;
}

function getVariantGroupKey(product: ClientProduct) {
  return [
    normalizeText(product.storeName ?? ""),
    normalizeText(product.category ?? ""),
    normalizeBaseTitle(product.title),
  ].join("|");
}

function normalizeBaseTitle(title: string) {
  let normalized = normalizeText(title);

  for (const definition of COLOR_DEFINITIONS) {
    for (const label of definition.labels) {
      normalized = normalized.replaceAll(normalizeText(label), " ");
    }
  }

  return normalized.replace(/\s+/g, " ").trim();
}

function extractColor(title: string) {
  const normalized = normalizeText(title);

  for (const definition of COLOR_DEFINITIONS) {
    if (definition.labels.some((label) => normalized.includes(normalizeText(label)))) {
      return {
        name: definition.name,
        hex: definition.hex,
      };
    }
  }

  return undefined;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, " ");
}
