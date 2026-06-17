const _rawAuthUrl = import.meta.env.VITE_AUTH_API_URL ?? "http://127.0.0.1:4001";
const AUTH_API_URL = _rawAuthUrl.trim().replace(/\/?auth\/?$/i, "").replace(/\/+$/, "");
type SellerRegisterPayload = {
  email: string;
  password: string;
  storeName: string;
  agreementAccepted: boolean;
};

type VerifyEmailPayload = {
  email: string;
  code: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  email: string;
  code: string;
  password: string;
};

type ResetPasswordCodePayload = {
  email: string;
  code: string;
};

export type SellerStatus =
  | "PENDING_LEGAL_DATA"
  | "UNDER_REVIEW"
  | "ACTIVATED"
  | "PAUSED"
  | "REJECTED"
  | "SUSPENDED";

export type SellerLegalProfilePayload = {
  businessType: string;
  taxId: string;
  legalName: string;
  legalAddress: string;
  bankName: string;
  iban: string;
};

export type SellerLegalProfile = SellerLegalProfilePayload & {
  id: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
};

export type SellerProfile = {
  id: string;
  accountId: string;
  email: string;
  storeName: string;
  description?: string;
  city?: string;
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
  coverUrl: string | null;
  avatarUrl: string | null;
  legalProfile: SellerLegalProfile | null;
  createdAt: string;
  updatedAt: string;
};

// Базовый HTTP-клиент auth-service для продавца: добавляет cookies, JSON-заголовки и обновляет seller-сессию при 401.
async function authRequest<T>(
  path: string,
  options: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const response = await fetch(`${AUTH_API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      response.status === 401 &&
      retryOnUnauthorized &&
      path.startsWith("/auth/seller/") &&
      path !== "/auth/seller/login" &&
      path !== "/auth/seller/refresh"
    ) {
      await refreshSellerSession();
      return authRequest<T>(path, options, false);
    }

    throw new Error(data?.message ?? "Auth request failed");
  }

  return data as T;
}

let refreshPromise: Promise<{ message: string }> | null = null;

// Обновляет seller access/refresh cookies через refresh endpoint.
export function refreshSellerSession() {
  if (!refreshPromise) {
    refreshPromise = authRequest<{ message: string }>(
      "/auth/seller/refresh",
      {
        method: "POST",
      },
      false,
    ).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Регистрирует профиль продавца и запускает отправку кода подтверждения email.
export function registerSellerProfile(payload: SellerRegisterPayload) {
  return authRequest<{ message: string }>("/auth/seller/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Подтверждает email продавца по шестизначному коду.
export function verifySellerEmail(payload: VerifyEmailPayload) {
  return authRequest<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Повторно отправляет код подтверждения email продавца.
export function resendSellerVerificationCode(email: string) {
  return authRequest<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// Авторизует продавца и получает seller auth cookies.
export function loginSellerAccount(payload: LoginPayload) {
  return authRequest<{ message: string }>("/auth/seller/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Загружает текущий профиль продавца по активной seller-сессии.
export function getCurrentSeller() {
  return authRequest<SellerProfile>("/auth/seller/me");
}

export type UpdateSellerProfilePayload = {
  storeName?: string;
  description?: string;
  city?: string;
  phone?: string;
  email?: string;
  coverUrl?: string;
  avatarUrl?: string;
};

// Обновляет базовые данные профиля продавца
export function updateSellerProfile(payload: UpdateSellerProfilePayload) {
  return authRequest<SellerProfile>("/auth/seller/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Сохраняет юридические данные продавца без отправки на модерацию.
export function saveSellerLegalProfile(payload: SellerLegalProfilePayload) {
  return authRequest<SellerLegalProfile>("/auth/seller/legal-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Отправляет заполненные юридические данные продавца на модерацию.
export function submitSellerLegalProfile() {
  return authRequest<{ message: string; status: SellerStatus }>(
    "/auth/seller/legal-profile/submit",
    {
      method: "POST",
    },
  );
}

export function pauseSellerStore() {
  return authRequest<SellerProfile>("/auth/seller/store/pause", {
    method: "POST",
  });
}

export function resumeSellerStore() {
  return authRequest<SellerProfile>("/auth/seller/store/resume", {
    method: "POST",
  });
}

// Завершает seller-сессию и очищает auth cookies продавца.
export function logoutSellerAccount() {
  return authRequest<{ message: string }>("/auth/seller/logout", {
    method: "POST",
  });
}

// Запрашивает письмо с кодом восстановления seller-пароля.
export function requestSellerPasswordReset(payload: ForgotPasswordPayload) {
  return authRequest<{ message: string }>("/auth/seller/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Проверяет код восстановления seller-пароля до перехода к новому паролю.
export function verifySellerPasswordResetCode(payload: ResetPasswordCodePayload) {
  return authRequest<{ message: string }>("/auth/seller/reset-password/verify-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Меняет seller-пароль по валидному коду восстановления.
export function resetSellerPassword(payload: ResetPasswordPayload) {
  return authRequest<{ message: string }>("/auth/seller/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
