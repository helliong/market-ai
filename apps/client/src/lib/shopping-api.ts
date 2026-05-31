const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4001";

const SHOPPING_API_URL =
  process.env.NEXT_PUBLIC_SHOPPING_API_URL ??
  AUTH_API_URL.replace(/:4001$/, ":4002");

export type ServerCartItem = {
  productId: number;
  quantity: number;
};

export type ServerCartResponse = {
  items: ServerCartItem[];
};

export type ServerIdsResponse = {
  ids: number[];
  limit?: number;
};

async function shoppingRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${SHOPPING_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Shopping request failed");
  }

  return data as T;
}

export function getServerCart() {
  return shoppingRequest<ServerCartResponse>("/cart");
}

export function addServerCartItem(productId: number, quantity = 1) {
  return shoppingRequest<ServerCartResponse>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

export function updateServerCartItem(productId: number, quantity: number) {
  return shoppingRequest<ServerCartResponse>(`/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeServerCartItem(productId: number) {
  return shoppingRequest<ServerCartResponse>(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

export function clearServerCart() {
  return shoppingRequest<ServerCartResponse>("/cart", {
    method: "DELETE",
  });
}

export function getServerFavorites() {
  return shoppingRequest<ServerIdsResponse>("/favorites");
}

export function addServerFavorite(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/favorites/${productId}`, {
    method: "POST",
  });
}

export function removeServerFavorite(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/favorites/${productId}`, {
    method: "DELETE",
  });
}

export function getServerCompare() {
  return shoppingRequest<ServerIdsResponse>("/compare");
}

export function addServerCompare(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/compare/${productId}`, {
    method: "POST",
  });
}

export function removeServerCompare(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/compare/${productId}`, {
    method: "DELETE",
  });
}
