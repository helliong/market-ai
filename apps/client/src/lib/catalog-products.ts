import { products as staticProducts } from "@/data/products";

export type ClientProduct = {
  id: number;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  badge?: string;
  description?: string;
  storeName?: string;
  categoryIds: number[];
};

type ApiProduct = {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  storeName?: string;
};

const CATALOG_API_URL =
  process.env.NEXT_PUBLIC_CATALOG_API_URL ?? "http://127.0.0.1:4003";

export async function getCatalogProducts(): Promise<ClientProduct[]> {
  const apiProducts = await fetchApiProducts();
  return mergeProducts(apiProducts.map(mapApiProduct));
}

export async function getCatalogProduct(
  productId: number,
): Promise<ClientProduct | null> {
  const apiProduct = await fetchApiProduct(productId);

  if (apiProduct) {
    return mapApiProduct(apiProduct);
  }

  return staticProducts.find((product) => product.id === productId) ?? null;
}

export function mergeProducts(apiProducts: ClientProduct[]) {
  const apiProductIds = new Set(apiProducts.map((product) => product.id));

  return [
    ...apiProducts,
    ...staticProducts.filter((product) => !apiProductIds.has(product.id)),
  ];
}

async function fetchApiProducts() {
  try {
    const response = await fetch(`${CATALOG_API_URL}/products`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ApiProduct[];
  } catch {
    return [];
  }
}

async function fetchApiProduct(productId: number) {
  try {
    const response = await fetch(`${CATALOG_API_URL}/products/${productId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ApiProduct;
  } catch {
    return null;
  }
}

function mapApiProduct(product: ApiProduct): ClientProduct {
  return {
    id: product.id,
    title: product.name,
    price: formatPrice(product.price),
    rating: 4.8,
    reviews: 0,
    badge: "New",
    description: product.description,
    storeName: product.storeName ?? "MarketAI Store",
    categoryIds: inferCategoryIds(product.category),
  };
}

function inferCategoryIds(category: string) {
  const normalized = category.trim().toLowerCase();

  if (
    normalized.includes("phone") ||
    normalized.includes("smart") ||
    normalized.includes("смартф")
  ) {
    return [1, 2];
  }

  if (normalized.includes("sock") || normalized.includes("нос")) {
    return [3];
  }

  return [1];
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}
