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
    });

    return shuffleProducts(products).map((product) => this.toResponse(product));
  }

  async findProduct(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: 'active',
        storeStatus: 'ACTIVATED',
        stock: { gt: 0 },
      },
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
  }) {
    return {
      ...product,
      price: product.price.toNumber(),
      rating: product.rating.toNumber(),
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
