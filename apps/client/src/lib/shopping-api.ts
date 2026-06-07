import { fetchWithAuth } from "./fetch-client";

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

// Получает корзину текущего пользователя с сервера.
export function getServerCart() {
  return fetchWithAuth<ServerCartResponse>(`${SHOPPING_API_URL}/cart`);
}

// Добавляет товар в серверную корзину или увеличивает его количество.
export function addServerCartItem(productId: number, quantity = 1) {
  return fetchWithAuth<ServerCartResponse>(`${SHOPPING_API_URL}/cart/items`, {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
}

// Устанавливает точное количество товара в серверной корзине.
export function updateServerCartItem(productId: number, quantity: number) {
  return fetchWithAuth<ServerCartResponse>(`${SHOPPING_API_URL}/cart/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

// Удаляет товар из серверной корзины.
export function removeServerCartItem(productId: number) {
  return fetchWithAuth<ServerCartResponse>(`${SHOPPING_API_URL}/cart/items/${productId}`, {
    method: "DELETE",
  });
}

// Полностью очищает серверную корзину пользователя.
export function clearServerCart() {
  return fetchWithAuth<ServerCartResponse>(`${SHOPPING_API_URL}/cart`, {
    method: "DELETE",
  });
}

// Получает избранные товары пользователя с сервера.
export function getServerFavorites() {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/favorites`);
}

// Добавляет товар в серверное избранное.
export function addServerFavorite(productId: number) {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/favorites/${productId}`, {
    method: "POST",
  });
}

// Удаляет товар из серверного избранного.
export function removeServerFavorite(productId: number) {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/favorites/${productId}`, {
    method: "DELETE",
  });
}

// Получает список товаров для сравнения с сервера.
export function getServerCompare() {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/compare`);
}

// Добавляет товар в серверный список сравнения.
export function addServerCompare(productId: number) {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/compare/${productId}`, {
    method: "POST",
  });
}

// Удаляет товар из серверного списка сравнения.
export function removeServerCompare(productId: number) {
  return fetchWithAuth<ServerIdsResponse>(`${SHOPPING_API_URL}/compare/${productId}`, {
    method: "DELETE",
  });
}
