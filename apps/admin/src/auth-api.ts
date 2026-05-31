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

export type SellerStatus =
  | "PENDING_LEGAL_DATA"
  | "UNDER_REVIEW"
  | "ACTIVATED"
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
};

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

function refreshSellerSession() {
  return authRequest<{ message: string }>(
    "/auth/seller/refresh",
    {
      method: "POST",
    },
    false,
  );
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

export function saveSellerLegalProfile(payload: SellerLegalProfilePayload) {
  return authRequest<SellerLegalProfile>("/auth/seller/legal-profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function submitSellerLegalProfile() {
  return authRequest<{ message: string; status: SellerStatus }>(
    "/auth/seller/legal-profile/submit",
    {
      method: "POST",
    },
  );
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
