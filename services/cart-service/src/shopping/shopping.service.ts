import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const COMPARE_LIMIT = 6;

@Injectable()
export class ShoppingService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(accountId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };
  }

  async addCartItem(accountId: string, productId: number, quantity = 1) {
    this.assertProductId(productId);

    await this.prisma.cartItem.upsert({
      where: { accountId_productId: { accountId, productId } },
      update: { quantity: { increment: quantity } },
      create: { accountId, productId, quantity },
    });

    return this.getCart(accountId);
  }

  async updateCartItem(accountId: string, productId: number, quantity: number) {
    this.assertProductId(productId);

    await this.prisma.cartItem.upsert({
      where: { accountId_productId: { accountId, productId } },
      update: { quantity },
      create: { accountId, productId, quantity },
    });

    return this.getCart(accountId);
  }

  async removeCartItem(accountId: string, productId: number) {
    this.assertProductId(productId);

    await this.prisma.cartItem.deleteMany({
      where: { accountId, productId },
    });

    return this.getCart(accountId);
  }

  async clearCart(accountId: string) {
    await this.prisma.cartItem.deleteMany({
      where: { accountId },
    });

    return { items: [] };
  }

  async getFavorites(accountId: string) {
    const items = await this.prisma.favoriteItem.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    return { ids: items.map((item) => item.productId) };
  }

  async addFavorite(accountId: string, productId: number) {
    this.assertProductId(productId);

    await this.prisma.favoriteItem.upsert({
      where: { accountId_productId: { accountId, productId } },
      update: {},
      create: { accountId, productId },
    });

    return this.getFavorites(accountId);
  }

  async removeFavorite(accountId: string, productId: number) {
    this.assertProductId(productId);

    await this.prisma.favoriteItem.deleteMany({
      where: { accountId, productId },
    });

    return this.getFavorites(accountId);
  }

  async getCompare(accountId: string) {
    const items = await this.prisma.compareItem.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    return { ids: items.map((item) => item.productId), limit: COMPARE_LIMIT };
  }

  async addCompare(accountId: string, productId: number) {
    this.assertProductId(productId);

    const existingItem = await this.prisma.compareItem.findUnique({
      where: { accountId_productId: { accountId, productId } },
    });

    if (existingItem) {
      return this.getCompare(accountId);
    }

    const count = await this.prisma.compareItem.count({
      where: { accountId },
    });

    if (count >= COMPARE_LIMIT) {
      throw new BadRequestException('Compare limit reached');
    }

    await this.prisma.compareItem.create({
      data: { accountId, productId },
    });

    return this.getCompare(accountId);
  }

  async removeCompare(accountId: string, productId: number) {
    this.assertProductId(productId);

    await this.prisma.compareItem.deleteMany({
      where: { accountId, productId },
    });

    return this.getCompare(accountId);
  }

  private assertProductId(productId: number) {
    if (!Number.isInteger(productId) || productId < 1) {
      throw new BadRequestException('Invalid product id');
    }
  }
}
