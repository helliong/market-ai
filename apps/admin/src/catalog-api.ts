import type { Product, ProductForm } from "./admin/types";
import { refreshSellerSession } from "./auth-api";

const CATALOG_API_URL =
  import.meta.env.VITE_CATALOG_API_URL ?? "http://127.0.0.1:4003";

async function catalogRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const response = await fetch(`${CATALOG_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && retryOnUnauthorized) {
      await refreshSellerSession();
      return catalogRequest<T>(path, options, false);
    }

    throw new Error(formatCatalogError(data));
  }

  return data as T;
}

function productPayloadFromForm(form: ProductForm) {
  return {
    sku: form.sku,
    name: form.name,
    description: form.description,
    category: form.category,
    price: parseFormNumber(form.price),
    oldPrice: form.oldPrice ? parseFormNumber(form.oldPrice) : undefined,
    stock: parseFormNumber(form.stock),
    status: form.status,
    images: form.images.map((image, index) => ({
      url: image.url,
      isMain: image.isMain,
      sortOrder: index,
    })),
  };
}

function parseFormNumber(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export function getSellerProducts() {
  return catalogRequest<Product[]>("/seller/products");
}

export function searchSellerProducts(query: string) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getSellerProducts();
  }

  return catalogRequest<Product[]>(
    `/seller/products/search?q=${encodeURIComponent(normalizedQuery)}`,
  );
}

export function createSellerProduct(form: ProductForm) {
  return catalogRequest<Product>("/seller/products", {
    method: "POST",
    body: JSON.stringify(productPayloadFromForm(form)),
  });
}

export function updateSellerProduct(productId: number, form: ProductForm) {
  return catalogRequest<Product>(`/seller/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(productPayloadFromForm(form)),
  });
}

export function deleteSellerProduct(productId: number) {
  return catalogRequest<{ message: string }>(`/seller/products/${productId}`, {
    method: "DELETE",
  });
}

export async function downloadSellerProductsTemplate(
  retryOnUnauthorized = true,
) {
  const response = await fetch(`${CATALOG_API_URL}/seller/products/template`, {
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401 && retryOnUnauthorized) {
      await refreshSellerSession();
      return downloadSellerProductsTemplate(false);
    }

    const data = await response.json().catch(() => null);
    throw new Error(formatCatalogError(data));
  }

  return response.blob();
}

export async function importSellerProductsTemplate(
  file: File,
  retryOnUnauthorized = true,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${CATALOG_API_URL}/seller/products/import`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && retryOnUnauthorized) {
      await refreshSellerSession();
      return importSellerProductsTemplate(file, false);
    }

    throw new Error(formatCatalogError(data));
  }

  return data as {
    created: number;
    updated: number;
    deleted: number;
    total: number;
  };
}

function formatCatalogError(data: unknown) {
  if (!data || typeof data !== "object") {
    return "Catalog request failed";
  }

  const payload = data as { message?: string | string[]; errors?: string[] };

  if (payload.errors?.length) {
    return payload.errors.join("\n");
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join("\n");
  }

  return payload.message ?? "Catalog request failed";
}
