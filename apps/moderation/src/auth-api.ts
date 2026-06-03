const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ?? "http://127.0.0.1:4001";

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
