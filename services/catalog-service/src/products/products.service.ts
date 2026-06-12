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
                  Prisma.sql`("name" ILIKE ${`%${token}%`} OR "sku" ILIKE ${`%${token}%`})`,
              ),
              ' AND ',
            )}
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
        ) AS score
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
