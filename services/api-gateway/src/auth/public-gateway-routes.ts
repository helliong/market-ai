const publicAuthRoutes = [
  /^\/api\/auth\/register$/,
  /^\/api\/auth\/seller\/register$/,
  /^\/api\/auth\/verify-email$/,
  /^\/api\/auth\/resend-verification$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/seller\/login$/,
  /^\/api\/auth\/refresh$/,
  /^\/api\/auth\/seller\/refresh$/,
  /^\/api\/auth\/forgot-password$/,
  /^\/api\/auth\/seller\/forgot-password$/,
  /^\/api\/auth\/reset-password\/verify-code$/,
  /^\/api\/auth\/reset-password$/,
  /^\/api\/auth\/seller\/reset-password\/verify-code$/,
  /^\/api\/auth\/seller\/reset-password$/,
  /^\/api\/auth\/admin\/login$/,
  /^\/api\/auth\/store\/[^/]+$/,
];

const publicRoutes = [
  ...publicAuthRoutes,
  /^\/api\/ai\/chat$/,
  /^\/api\/ai\/chat\/sessions(?:\/.*)?$/,
  /^\/api\/catalog\/products(?:\/.*)?$/,
  /^\/api\/storage$/,
  /^\/api\/order\/payments\/yookassa\/webhook$/,
  /^\/api\/orders\/payments\/yookassa\/webhook$/,
];

export function isPublicGatewayRoute(method: string, path: string) {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === '/api/catalog' && method === 'GET') {
    return true;
  }

  if (normalizedPath === '/api/storage' && method === 'GET') {
    return true;
  }

  return publicRoutes.some((route) => route.test(normalizedPath));
}

export function isAuthRateLimitedRoute(path: string) {
  return normalizePath(path).startsWith('/api/auth/');
}

export function isPublicRateLimitedRoute(method: string, path: string) {
  return isPublicGatewayRoute(method, path) && !isAuthRateLimitedRoute(path);
}

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}
