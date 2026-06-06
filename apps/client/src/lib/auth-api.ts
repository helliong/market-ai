const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4001";

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type VerifyEmailPayload = {
  email: string;
  code: string;
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

export type CurrentUser = {
  id: string;
  name: string | null;
  displayName?: string | null;
  email: string;
  phone: string | null;
  isEmailVerified: boolean;
  hasUserProfile?: boolean;
  hasSellerProfile?: boolean;
  sellerStatus?: string | null;
  createdAt: string;
};

export type UpdateClientProfilePayload = {
  displayName?: string;
  email?: string;
  phone?: string;
};

export type BuyerProfile = {
  id: string;
  accountId: string;
  email: string;
  displayName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

// Базовый HTTP-клиент auth-service: добавляет cookies, JSON-заголовки и обрабатывает ошибки.
async function authRequest<T>(
  path: string,
  options: RequestInit = {},
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
    throw new Error(data?.message ?? "Auth request failed");
  }

  return data as T;
}

// Регистрирует покупателя и запускает отправку кода подтверждения email.
export function registerClient(payload: RegisterPayload) {
  return authRequest<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Подтверждает email покупателя по шестизначному коду из письма.
export function verifyClientEmail(payload: VerifyEmailPayload) {
  return authRequest<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Авторизует покупателя и получает auth cookies от backend.
export function loginClient(payload: LoginPayload) {
  return authRequest<{ message: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Завершает buyer-сессию и очищает auth cookies на backend.
export function logoutClient() {
  return authRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

// Загружает текущего пользователя по активной buyer-сессии.
export function getCurrentUser() {
  return authRequest<CurrentUser>("/auth/me");
}

// Обновляет buyer-профиль текущего пользователя.
export function updateClientProfile(payload: UpdateClientProfilePayload) {
  return authRequest<BuyerProfile>("/auth/user/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Запрашивает письмо с кодом восстановления пароля покупателя.
export function requestClientPasswordReset(payload: ForgotPasswordPayload) {
  return authRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Проверяет код восстановления до перехода к вводу нового пароля.
export function verifyClientPasswordResetCode(payload: ResetPasswordCodePayload) {
  return authRequest<{ message: string }>("/auth/reset-password/verify-code", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Меняет пароль покупателя по валидному коду восстановления.
export function resetClientPassword(payload: ResetPasswordPayload) {
  return authRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
