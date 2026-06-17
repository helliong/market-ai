const AUTH_PATH_SUFFIX_RE = /\/?auth\/?$/i;

export function getAuthBaseUrl() {
  const authApiUrl =
    process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:4001";

  return authApiUrl.trim().replace(AUTH_PATH_SUFFIX_RE, "").replace(/\/+$/, "");
}

export function getAuthUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getAuthBaseUrl()}${normalizedPath}`;
}
