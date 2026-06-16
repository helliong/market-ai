import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        storeStatus: 'ACTIVATED',
        stock: { gt: 0 },
      },
      include: productWithImages,
    });

    return shuffleProducts(products).map((product) => this.toResponse(product));
  }

  async searchProducts(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return this.findProducts();
    }

    const queryTokens = getSearchTokens(normalizedQuery);
    const isSpecificQuery = queryTokens.length > 1;
    const specificMatchCondition = isSpecificQuery
      ? Prisma.sql`
        (
          "name" ILIKE ${`%${normalizedQuery}%`}
          OR "sku" ILIKE ${`%${normalizedQuery}%`}
          OR (
            ${Prisma.join(
              queryTokens.map(
                (token) =>
                  Prisma.sql`(
                    "name" ILIKE ${`%${token}%`}
                    OR "sku" ILIKE ${`%${token}%`}
                    OR "category" ILIKE ${`%${token}%`}
                    OR "description" ILIKE ${`%${token}%`}
                    OR word_similarity(${token}, "name") >= 0.25
                    OR word_similarity(${token}, "category") >= 0.25
                    OR word_similarity(${token}, "description") >= 0.25
                  )`,
              ),
              ' AND ',
            )}
            AND (
              ${Prisma.join(
                queryTokens.map(
                  (token) => Prisma.sql`
                    (
                      "name" ILIKE ${`%${token}%`}
                      OR "category" ILIKE ${`%${token}%`}
                      OR word_similarity(${token}, "name") >= 0.25
                      OR word_similarity(${token}, "category") >= 0.25
                    )
                  `,
                ),
                ' OR ',
              )}
            )
          )
        )
      `
      : Prisma.sql`
        (
          "name" % ${normalizedQuery}
          OR "sku" % ${normalizedQuery}
          OR "name" ILIKE ${`%${normalizedQuery}%`}
          OR "sku" ILIKE ${`%${normalizedQuery}%`}
          OR "storeName" ILIKE ${`%${normalizedQuery}%`}
          OR "category" % ${normalizedQuery}
          OR "storeName" % ${normalizedQuery}
          OR "description" % ${normalizedQuery}
          OR "category" ILIKE ${`%${normalizedQuery}%`}
        )
      `;

    const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
      SELECT
        id,
        GREATEST(
          similarity("name", ${normalizedQuery}) * 3.0,
          similarity("sku", ${normalizedQuery}) * 2.6,
          similarity("category", ${normalizedQuery}) * 2.0,
          similarity("storeName", ${normalizedQuery}) * 1.8,
          similarity("description", ${normalizedQuery})
        )
        + ${
          queryTokens.length
            ? Prisma.join(
                queryTokens.map(
                  (token) => Prisma.sql`
                    GREATEST(
                      word_similarity(${token}, "name") * 5.0,
                      word_similarity(${token}, "category") * 4.0,
                      CASE
                        WHEN "description" ILIKE ${`%${token}%`} THEN 0.5
                        ELSE word_similarity(${token}, "description") * 0.25
                      END
                    )
                  `,
                ),
                ' + ',
              )
            : Prisma.sql`0`
        } AS score
      FROM "Product"
      WHERE "status" = 'active'
        AND "storeStatus" = 'ACTIVATED'
        AND "stock" > 0
        AND ${specificMatchCondition}
      ORDER BY score DESC, "reviews" DESC, "rating" DESC
      LIMIT 120
    `;

    if (!rows.length) {
      return [];
    }

    const orderById = new Map(rows.map((row, index) => [row.id, index]));
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: rows.map((row) => row.id),
        },
      },
      include: productWithImages,
    });

    return products
      .sort((left, right) => {
        return (orderById.get(left.id) ?? 0) - (orderById.get(right.id) ?? 0);
      })
      .map((product) => this.toResponse(product));
  }

  async suggestProducts(query: string) {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ suggestion: string; score: number }>
    >`
      SELECT suggestion, MAX(score) AS score
      FROM (
        SELECT
          "name" AS suggestion,
          GREATEST(
            similarity("name", ${normalizedQuery}) * 3.0,
            CASE WHEN "name" ILIKE ${`%${normalizedQuery}%`} THEN 4.0 ELSE 0 END
          ) AS score
        FROM "Product"
        WHERE "status" = 'active'
          AND "storeStatus" = 'ACTIVATED'
          AND "stock" > 0
          AND ("name" % ${normalizedQuery} OR "name" ILIKE ${`%${normalizedQuery}%`})

        UNION ALL

        SELECT
          "category" AS suggestion,
          GREATEST(
            similarity("category", ${normalizedQuery}) * 2.0,
            CASE WHEN "category" ILIKE ${`%${normalizedQuery}%`} THEN 3.0 ELSE 0 END
          ) AS score
        FROM "Product"
        WHERE "status" = 'active'
          AND "storeStatus" = 'ACTIVATED'
          AND "stock" > 0
          AND ("category" % ${normalizedQuery} OR "category" ILIKE ${`%${normalizedQuery}%`})
      ) AS matched_suggestions
      GROUP BY suggestion
      ORDER BY score DESC, LENGTH(suggestion), suggestion
      LIMIT 7
    `;

    return rows.map((row) => row.suggestion);
  }

  async findProduct(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: 'active',
        storeStatus: 'ACTIVATED',
        stock: { gt: 0 },
      },
      include: productWithImages,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toResponse(product);
  }

  async findProductBySku(sku: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        sku,
        status: 'active',
        storeStatus: 'ACTIVATED',
        stock: { gt: 0 },
      },
      include: productWithImages,
    });

    if (!product) {
      throw new NotFoundException('Product not found by SKU');
    }

    return this.toResponse(product);
  }

  private toResponse(product: {
    id: number;
    sellerId: string;
    storeName: string;
    storeStatus: string;
    sku: string;
    name: string;
    description: string;
    attributes: Prisma.JsonValue;
    category: string;
    price: Prisma.Decimal;
    rating: Prisma.Decimal;
    reviews: number;
    stock: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    images?: {
      id: string;
      url: string;
      isMain: boolean;
      sortOrder: number;
      productId: number;
    }[];
  }) {
    return {
      ...product,
      price: product.price.toNumber(),
      rating: product.rating.toNumber(),
      attributes: normalizeProductAttributes(
        product.attributes,
        product.description,
      ),
      images: product.images ?? [],
    };
  }

  async reserveProductsStock(items: { productId: number; quantity: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    );
  }

  async releaseProductsStock(items: { productId: number; quantity: number }[]) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        }),
      ),
    );
  }
}

const productWithImages = {
  images: {
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.ProductInclude;

function normalizeProductAttributes(
  value: unknown,
  fallbackDescription = '',
): Record<string, string> {
  const parsedFromDescription = parseDescriptionAttributes(fallbackDescription);

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return parsedFromDescription;
  }

  const attributes = Object.entries(value)
    .map(
      ([key, attrValue]) =>
        [key.trim(), String(attrValue ?? '').trim()] as const,
    )
    .filter(([key, attrValue]) => key.length > 0 && attrValue.length > 0);

  return {
    ...parsedFromDescription,
    ...Object.fromEntries(attributes),
  };
}

function parseDescriptionAttributes(
  description: string,
): Record<string, string> {
  const header = 'Характеристики:';
  const headerIndex = description.indexOf(header);

  if (headerIndex === -1) {
    return {};
  }

  return description
    .slice(headerIndex + header.length)
    .split(/\r?\n/)
    .reduce<Record<string, string>>((result, line) => {
      const separatorIndex = line.indexOf(':');

      if (separatorIndex <= 0) {
        return result;
      }

      const key = line.slice(0, separatorIndex).trim();
      const attrValue = line.slice(separatorIndex + 1).trim();

      if (key && attrValue) {
        result[key] = attrValue;
      }

      return result;
    }, {});
}

function shuffleProducts<T>(products: T[]) {
  const shuffled = [...products];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getSearchTokens(query: string) {
  return query
    .toLowerCase()
    .split(/[\s,.;:!?()[\]{}"']+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}
