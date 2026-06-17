const _rawAuthUrl = import.meta.env.VITE_AUTH_API_URL ?? "http://127.0.0.1:4001";
const AUTH_API_URL = _rawAuthUrl.trim().replace(/\/?auth\/?$/i, "").replace(/\/+$/, "");

export type SellerStatus =
  | "PENDING_LEGAL_DATA"
  | "UNDER_REVIEW"
  | "ACTIVATED"
  | "REJECTED"
  | "SUSPENDED";

export type SellerLegalProfile = {
  id: string;
  sellerId: string;
  businessType: string;
  taxId: string;
  legalName: string;
  legalAddress: string;
  bankName: string;
  iban: string;
  createdAt: string;
  updatedAt: string;
};

export type ModerationSeller = {
  id: string;
  accountId: string;
  email: string;
  storeName: string;
  ownerEmail: string;
  ownerName: string;
  status: SellerStatus;
  reviewComment: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  agreementAcceptedAt: string;
  legalName: string | null;
  inn: string | null;
  phone: string | null;
  legalProfile: SellerLegalProfile | null;
  createdAt: string;
  updatedAt: string;
  account: {
    email: string;
    isEmailVerified: boolean;
  };
};

// Базовый HTTP-клиент moderation API: добавляет admin key и обрабатывает ошибки ответа.
async function moderationRequest<T>(
  adminKey: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": adminKey,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Запрос модерации не выполнен");
  }

  return data as T;
}

// Загружает список продавцов, ожидающих ручной проверки legal data.
export function getModerationSellers(adminKey: string) {
  return moderationRequest<ModerationSeller[]>(
    adminKey,
    "/auth/admin/sellers/review",
  );
}

// Одобряет продавца после проверки юридических данных.
export function approveModerationSeller(adminKey: string, sellerId: string) {
  return moderationRequest<ModerationSeller>(
    adminKey,
    `/auth/admin/sellers/${sellerId}/approve`,
    { method: "POST" },
  );
}

// Отклоняет продавца и отправляет комментарий с причиной отказа.
export function rejectModerationSeller(
  adminKey: string,
  sellerId: string,
  comment: string,
) {
  return moderationRequest<ModerationSeller>(
    adminKey,
    `/auth/admin/sellers/${sellerId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ comment }),
    },
  );
}

export type ModerationUser = {
  id: string;
  accountId: string;
  email: string;
  displayName: string;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: string;
};

// Поиск пользователей (покупателей) по email или телефону.
export function searchModerationUsers(adminKey: string, query: string) {
  return moderationRequest<ModerationUser[]>(
    adminKey,
    `/auth/admin/users/search?q=${encodeURIComponent(query)}`,
  );
}

// Поиск продавцов (магазинов) по названию, email, юридическому названию или ИНН.
export function searchModerationSellers(adminKey: string, query: string) {
  return moderationRequest<ModerationSeller[]>(
    adminKey,
    `/auth/admin/sellers/search?q=${encodeURIComponent(query)}`,
  );
}

// Авторизация администратора
export async function loginModerationAdmin(
  email: string,
  password: string,
  adminKey: string,
) {
  const response = await fetch(`${AUTH_API_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, adminKey }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Ошибка авторизации модератора");
  }

  return data as { adminKey: string };
}


