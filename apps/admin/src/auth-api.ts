const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ?? "http://127.0.0.1:4001";

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

export type SellerProfile = {
  id: string;
  accountId: string;
  storeName: string;
  status: string;
  agreementAcceptedAt: string;
  legalName: string | null;
  inn: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export function registerSellerProfile(payload: SellerRegisterPayload) {
  return authRequest<{ message: string }>("/auth/seller/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifySellerEmail(payload: VerifyEmailPayload) {
  return authRequest<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendSellerVerificationCode(email: string) {
  return authRequest<{ message: string }>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function loginSellerAccount(payload: LoginPayload) {
  return authRequest<{ message: string }>("/auth/seller/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentSeller() {
  return authRequest<SellerProfile>("/auth/seller/me");
}

export function logoutSellerAccount() {
  return authRequest<{ message: string }>("/auth/seller/logout", {
    method: "POST",
  });
}

export function requestSellerPasswordReset(payload: ForgotPasswordPayload) {
  return authRequest<{ message: string }>("/auth/seller/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetSellerPassword(payload: ResetPasswordPayload) {
  return authRequest<{ message: string }>("/auth/seller/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
