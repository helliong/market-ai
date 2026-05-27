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

export type CurrentUser = {
  id: string;
  name: string | null;
  displayName?: string | null;
  email: string;
  isEmailVerified: boolean;
  hasUserProfile?: boolean;
  hasSellerProfile?: boolean;
  sellerStatus?: string | null;
  createdAt: string;
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

export function registerClient(payload: RegisterPayload) {
  return authRequest<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyClientEmail(payload: VerifyEmailPayload) {
  return authRequest<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginClient(payload: LoginPayload) {
  return authRequest<{ message: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logoutClient() {
  return authRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return authRequest<CurrentUser>("/auth/me");
}

export function requestClientPasswordReset(payload: ForgotPasswordPayload) {
  return authRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetClientPassword(payload: ResetPasswordPayload) {
  return authRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
