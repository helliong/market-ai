import {
  isAuthRateLimitedRoute,
  isPublicGatewayRoute,
  isPublicRateLimitedRoute,
} from './public-gateway-routes';

describe('public gateway routes', () => {
  it('allows public auth and catalog routes without gateway auth', () => {
    expect(isPublicGatewayRoute('POST', '/api/auth/login')).toBe(true);
    expect(isPublicGatewayRoute('POST', '/api/ai/chat')).toBe(true);
    expect(isPublicGatewayRoute('GET', '/api/catalog/products')).toBe(true);
  });

  it('keeps cart routes protected', () => {
    expect(isPublicGatewayRoute('GET', '/api/cart')).toBe(false);
  });

  it('separates auth brute-force limits from public catalog limits', () => {
    expect(isAuthRateLimitedRoute('/api/auth/login')).toBe(true);
    expect(isPublicRateLimitedRoute('GET', '/api/catalog/products')).toBe(true);
    expect(isPublicRateLimitedRoute('POST', '/api/auth/login')).toBe(false);
  });
});
