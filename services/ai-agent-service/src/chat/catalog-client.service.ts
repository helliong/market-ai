import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { Product } from './chat.types';

export type SearchProductsArguments = {
  query: string;
  maxPrice?: number;
  category?: string;
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
  }: SearchProductsArguments): Promise<Product[]> {
    const response = await firstValueFrom(
      this.httpService.get<Product[]>(`${this.baseUrl}/products/search`, {
        params: { q: query },
      }),
    );

    const priceMatches = response.data.filter(
      (product) => maxPrice === undefined || product.price <= maxPrice,
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

  async getProduct(productId: number): Promise<Product> {
    const response = await firstValueFrom(
      this.httpService.get<Product>(
        `${this.baseUrl}/products/${encodeURIComponent(productId)}`,
      ),
    );

    return response.data;
  }
}
