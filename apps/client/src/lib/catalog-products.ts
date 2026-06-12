export type ClientProduct = {
  id: number;
  sku: string;
  title: string;
  price: string;
  oldPrice?: string;
  rating: number;
  reviews: number;
  badge?: string;
  description?: string;
  storeName?: string;
  categoryIds: number[];
  category?: string;
  images: ClientProductImage[];
};

export type ClientProductImage = {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
};

type ApiProduct = {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  oldPrice?: number | string;
  rating?: number;
  reviews?: number;
  stock: number;
  status: string;
  storeName?: string;
  images?: ClientProductImage[];
};

const CATALOG_API_URL =
  process.env.NEXT_PUBLIC_CATALOG_API_URL ?? "http://127.0.0.1:4003";

export async function getCatalogProducts(): Promise<ClientProduct[]> {
  const apiProducts = await fetchApiProducts();
  return apiProducts.map(mapApiProduct);
}

export async function searchCatalogProducts(
  query: string,
): Promise<ClientProduct[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getCatalogProducts();
  }

  const apiProducts = await fetchApiSearchProducts(normalizedQuery);
  return apiProducts.map(mapApiProduct);
}

export async function getCatalogProduct(
  productId: number,
): Promise<ClientProduct | null> {
  const apiProduct = await fetchApiProduct(productId);

  if (apiProduct) {
    return mapApiProduct(apiProduct);
  }

  return null;
}

export async function getCatalogProductBySku(
  sku: string,
): Promise<ClientProduct | null> {
  const apiProduct = await fetchApiProductBySku(sku);

  if (apiProduct) {
    return mapApiProduct(apiProduct);
  }

  return null;
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

async function fetchApiSearchProducts(query: string) {
  try {
    const response = await fetch(
      `${CATALOG_API_URL}/products/search?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
      },
    );

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

async function fetchApiProductBySku(sku: string) {
  try {
    let response = await fetch(
      `${CATALOG_API_URL}/products/sku/${encodeURIComponent(sku)}`,
      {
        cache: "no-store",
      },
    );

    const upperSku = sku.toUpperCase();
    if (!response.ok && upperSku !== sku) {
      response = await fetch(
        `${CATALOG_API_URL}/products/sku/${encodeURIComponent(upperSku)}`,
        {
          cache: "no-store",
        },
      );
    }

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
    sku: product.sku,
    title: product.name,
    price: formatPrice(product.price),
    oldPrice: product.oldPrice ? formatPrice(Number(product.oldPrice)) : undefined,
    rating: product.rating ?? 0,
    reviews: product.reviews ?? 0,
    badge: "New",
    description: product.description,
    storeName: product.storeName ?? "MarketAI Store",
    categoryIds: inferCategoryIds(product.category),
    category: product.category,
    images: product.images ?? [],
  };
}

function inferCategoryIds(category: string) {
  const normalized = category.trim().toLowerCase();

  if (
    includesAny(normalized, [
      "clothing",
      "shirt",
      "shorts",
      "skirt",
      "pants",
      "dress",
      "\u043e\u0434\u0435\u0436",
      "\u0444\u0443\u0442\u0431\u043e\u043b",
      "\u0448\u043e\u0440\u0442",
      "\u044e\u0431\u043a",
      "\u0431\u0440\u044e\u043a",
      "\u043f\u043b\u0430\u0442\u044c",
      "\u0432\u0435\u0440\u0445\u043d",
      "\u043e\u0431\u0443\u0432",
      "\u043a\u0440\u043e\u0441\u0441\u043e\u0432",
      "\u0431\u043e\u0442\u0438\u043d",
      "\u0442\u0443\u0444\u043b",
      "\u0441\u0430\u043f\u043e\u0433",
    ])
  ) {
    return [3];
  }

  if (
    includesAny(normalized, [
      "sport",
      "fitness",
      "\u0441\u043f\u043e\u0440\u0442",
      "\u0442\u0440\u0435\u043d\u0430\u0436",
      "\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440",
    ])
  ) {
    return [5];
  }

  if (
    includesAny(normalized, [
      "home",
      "decor",
      "\u0434\u043e\u043c",
      "\u0431\u044b\u0442",
      "\u043f\u043e\u0441\u0443\u0434",
      "\u0442\u0435\u043a\u0441\u0442\u0438\u043b",
      "\u0434\u0435\u043a\u043e\u0440",
      "\u0445\u043e\u0437\u044f\u0439\u0441\u0442\u0432",
    ])
  ) {
    return [4];
  }

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

function includesAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}
