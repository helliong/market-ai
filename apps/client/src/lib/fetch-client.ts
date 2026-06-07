const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4001";

let isRefreshing = false;
let failedQueue: { resolve: (value: void | PromiseLike<void>) => void; reject: (reason?: any) => void }[] = [];

function processQueue(error: Error | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

/**
 * Базовый HTTP-клиент, который:
 * - автоматически добавляет credentials: 'include' и заголовки JSON
 * - перехватывает 401 Unauthorized
 * - прозрачно вызывает /auth/refresh и повторяет оригинальный запрос
 */
export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const mergedOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  let response = await fetch(url, mergedOptions);

  const isAuthRefresh = url.includes("/refresh") || url.includes("/login") || url.includes("/logout");

  // Перехватываем 401 только в браузере и не для эндпоинтов авторизации
  if (response.status === 401 && typeof window !== "undefined" && !isAuthRefresh) {
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => fetchWithAuth<T>(url, options));
    }

    isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${AUTH_API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Session expired");
      }

      processQueue(null);
      // Повторяем оригинальный запрос
      response = await fetch(url, mergedOptions);
    } catch (err) {
      processQueue(err as Error);
      const data = await response.json().catch(() => null);
      throw new Error(data?.message ?? "Request failed");
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
}
