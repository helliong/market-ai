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

export type GiftProductGroup = 'any' | 'electronics' | 'clothing';

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
    return this.findGiftProductsUnderPrice({ maxPrice });
  }

  async findGiftProductsUnderPrice({
    maxPrice,
    group = 'any',
    excludeProductIds = [],
  }: {
    maxPrice: number;
    group?: GiftProductGroup;
    excludeProductIds?: number[];
  }): Promise<Product[]> {
    const response = await firstValueFrom(
      this.httpService.get<Product[]>(`${this.baseUrl}/products/search`, {
        params: { q: '' },
      }),
    );
    const excludedIds = new Set(excludeProductIds);
    const priceMatches = response.data.filter(
      (product) =>
        product.price <= maxPrice &&
        !excludedIds.has(product.id) &&
        matchesGiftProductGroup(product, group),
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

const CLOTHING_CATEGORIES = new Set([
  'футболки',
  'брюки',
  'шорты',
  'верхняя одежда',
  'платья',
  'юбки',
  'обувь',
]);

function matchesGiftProductGroup(product: Product, group: GiftProductGroup) {
  if (group === 'any') {
    return true;
  }

  const normalizedCategory = product.category.trim().toLowerCase();
  const isClothing = CLOTHING_CATEGORIES.has(normalizedCategory);

  return group === 'clothing' ? isClothing : !isClothing;
}

function normalizeProductQuery(query: string) {
  const normalizedValue = query.toLowerCase().replace(/ё/g, 'е');
  const productType = getProductType(normalizedValue);

  if (productType) {
    return productType;
  }

  const normalizedTokens = normalizedValue
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

function getProductType(query: string) {
  const productTypes: Array<[RegExp, string]> = [
    [/ноутбук(?:и|а|ов|ом|ами|ах)?/i, 'ноутбук'],
    [/смартфон(?:ы|а|ов|ом|ами|ах)?/i, 'смартфон'],
    [/телефон(?:ы|а|ов|ом|ами|ах)?/i, 'телефон'],
    [/наушник(?:и|а|ов|ом|ами|ах)?/i, 'наушники'],
    [
      /умн(?:ые|ых|ыми|ым|ого|ому)?(?:\s+наручн(?:ые|ых|ыми)?)?\s+час(?:ы|ов|ами|ах)?/i,
      'смарт-часы',
    ],
    [/час(?:ы|ов|ами|ах)?\s+для\s+спорт/i, 'смарт-часы'],
    [/смарт[-\s]?час(?:ы|ов|ами|ах)?/i, 'смарт-часы'],
    [/планшет(?:ы|а|ов|ом|ами|ах)?/i, 'планшет'],
    [/монитор(?:ы|а|ов|ом|ами|ах)?/i, 'монитор'],
    [/клавиатур(?:а|ы|у|ой|ами|ах)/i, 'клавиатура'],
    [/мыш(?:ь|и|ью|ей|ам|ами|ах|ка|ки|ку|ке|кой|кою|ек|кам)/i, 'мышь'],
  ];

  return productTypes.find(([pattern]) => pattern.test(query))?.[1];
}
