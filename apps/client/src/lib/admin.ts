export const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:5173";

export const ADMIN_LOGIN_URL = `${ADMIN_APP_URL}/login`;
export const ADMIN_REGISTER_URL = `${ADMIN_APP_URL}/register`;
