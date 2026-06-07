import { fetchWithAuth } from "./fetch-client";

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
  birthDate?: string | null;
  gender?: string | null;
  createdAt: string;
};

export type UpdateClientProfilePayload = {
  displayName?: string;
  email?: string;
  phone?: string | null;
  birthDate?: string | null;
  gender?: string | null;
};

export type BuyerProfile = {
  id: string;
  accountId: string;
  email: string;
  displayName: string;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
};

// Регистрирует покупателя и запускает отправку кода подтверждения email.
export function registerClient(payload: RegisterPayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Подтверждает email покупателя по шестизначному коду из письма.
export function verifyClientEmail(payload: VerifyEmailPayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/verify-email`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Авторизует покупателя и получает auth cookies от backend.
export function loginClient(payload: LoginPayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Завершает buyer-сессию и очищает auth cookies на backend.
export function logoutClient() {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/logout`, {
    method: "POST",
  });
}

// Загружает текущего пользователя по активной buyer-сессии.
export function getCurrentUser() {
  return fetchWithAuth<CurrentUser>(`${AUTH_API_URL}/auth/me`);
}

// Обновляет buyer-профиль текущего пользователя.
export function updateClientProfile(payload: UpdateClientProfilePayload) {
  return fetchWithAuth<BuyerProfile>(`${AUTH_API_URL}/auth/user/me`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// Запрашивает письмо с кодом восстановления пароля покупателя.
export function requestClientPasswordReset(payload: ForgotPasswordPayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Проверяет код восстановления до перехода к вводу нового пароля.
export function verifyClientPasswordResetCode(payload: ResetPasswordCodePayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/reset-password/verify-code`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Меняет пароль покупателя по валидному коду восстановления.
export function resetClientPassword(payload: ResetPasswordPayload) {
  return fetchWithAuth<{ message: string }>(`${AUTH_API_URL}/auth/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PublicStoreProfile = {
  storeName: string;
  description: string | null;
  city: string | null;
  createdAt: string;
};

// Возвращает публичную информацию о магазине.
export function getPublicStoreProfile(storeName: string) {
  return fetchWithAuth<PublicStoreProfile>(`${AUTH_API_URL}/auth/store/${encodeURIComponent(storeName)}`);
}
