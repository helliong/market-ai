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

// Базовый HTTP-клиент cart-service: отправляет запросы с cookies и JSON-обработкой ошибок.
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

// Получает корзину текущего пользователя с сервера.
export function getServerCart() {
  return shoppingRequest<ServerCartResponse>("/cart");
}

// Добавляет товар в серверную корзину или увеличивает его количество.
export function addServerCartItem(productId: number, quantity = 1) {
  return shoppingRequest<ServerCartResponse>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

// Устанавливает точное количество товара в серверной корзине.
export function updateServerCartItem(productId: number, quantity: number) {
  return shoppingRequest<ServerCartResponse>(`/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

// Удаляет товар из серверной корзины.
export function removeServerCartItem(productId: number) {
  return shoppingRequest<ServerCartResponse>(`/cart/items/${productId}`, {
    method: "DELETE",
  });
}

// Полностью очищает серверную корзину пользователя.
export function clearServerCart() {
  return shoppingRequest<ServerCartResponse>("/cart", {
    method: "DELETE",
  });
}

// Получает избранные товары пользователя с сервера.
export function getServerFavorites() {
  return shoppingRequest<ServerIdsResponse>("/favorites");
}

// Добавляет товар в серверное избранное.
export function addServerFavorite(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/favorites/${productId}`, {
    method: "POST",
  });
}

// Удаляет товар из серверного избранного.
export function removeServerFavorite(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/favorites/${productId}`, {
    method: "DELETE",
  });
}

// Получает список товаров для сравнения с сервера.
export function getServerCompare() {
  return shoppingRequest<ServerIdsResponse>("/compare");
}

// Добавляет товар в серверный список сравнения.
export function addServerCompare(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/compare/${productId}`, {
    method: "POST",
  });
}

// Удаляет товар из серверного списка сравнения.
export function removeServerCompare(productId: number) {
  return shoppingRequest<ServerIdsResponse>(`/compare/${productId}`, {
    method: "DELETE",
  });
}
