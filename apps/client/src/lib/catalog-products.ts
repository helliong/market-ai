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
