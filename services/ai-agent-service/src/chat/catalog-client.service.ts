import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { Product } from './chat.types';

export type SearchProductsArguments = {
  query: string;
  maxPrice?: number;
  category?: string;
  excludeProductIds?: number[];
};

@Injectable()
export class CatalogClient {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl =
      configService.get<string>('CATALOG_SERVICE_URL') ??
      'http://catalog-service:4003';
  }

  async searchProducts({
    query,
    maxPrice,
    category,
    excludeProductIds = [],
  }: SearchProductsArguments): Promise<Product[]> {
    const normalizedQuery = normalizeProductQuery(query);
    const response = await firstValueFrom(
      this.httpService.get<Product[]>(`${this.baseUrl}/products/search`, {
        params: { q: normalizedQuery },
      }),
    );
    const excludedIds = new Set(excludeProductIds);

    const priceMatches = response.data.filter(
      (product) =>
        !excludedIds.has(product.id) &&
        (maxPrice === undefined || product.price <= maxPrice),
    );

    if (!category) {
      return priceMatches.slice(0, 5);
    }

    const normalizedCategory = category.toLowerCase();
    const categoryMatches = priceMatches.filter((product) =>
      product.category.toLowerCase().includes(normalizedCategory),
    );

    return (categoryMatches.length ? categoryMatches : priceMatches).slice(
      0,
      5,
    );
  }

  async findDiverseProductsUnderPrice(maxPrice: number): Promise<Product[]> {
    const response = await firstValueFrom(
      this.httpService.get<Product[]>(`${this.baseUrl}/products/search`, {
        params: { q: '' },
      }),
    );
    const priceMatches = response.data.filter(
      (product) => product.price <= maxPrice,
    );
    const selected: Product[] = [];
    const selectedIds = new Set<number>();
    const categories = new Set<string>();

    for (const product of priceMatches) {
      const category = product.category.toLowerCase();

      if (!categories.has(category)) {
        selected.push(product);
        selectedIds.add(product.id);
        categories.add(category);
      }

      if (selected.length === 5) {
        return selected;
      }
    }

    for (const product of priceMatches) {
      if (!selectedIds.has(product.id)) {
        selected.push(product);
      }

      if (selected.length === 5) {
        break;
      }
    }

    return selected;
  }

  async getProduct(productId: number): Promise<Product> {
    const response = await firstValueFrom(
      this.httpService.get<Product>(
        `${this.baseUrl}/products/${encodeURIComponent(productId)}`,
      ),
    );

    return response.data;
  }
}

function normalizeProductQuery(query: string) {
  const normalizedTokens = query
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[\s,.;:!?()[\]{}"']+/)
    .map((token) => {
      if (/^мыш(ка|ки|ку|ке|кой|кою|ек|кам|ками|ках)$/.test(token)) {
        return 'мышь';
      }

      return token;
    })
    .filter(
      (token) =>
        token &&
        !/^компьютерн(ый|ая|ое|ые|ого|ой|ому|ым|ую|ых|ыми)$/.test(token),
    );

  return normalizedTokens.join(' ') || query.trim();
}
