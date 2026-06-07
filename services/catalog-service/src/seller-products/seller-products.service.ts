import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProfileService } from './auth-profile.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productCategories } from './product-categories';
import {
  buildProductTemplateWorkbook,
  isTemplateAction,
  isTemplateStatus,
  parseProductWorkbook,
  type ProductTemplateRow,
} from './product-template-xlsx';

@Injectable()
export class SellerProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authProfileService: AuthProfileService,
  ) {}

  async findSellerProducts(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.toResponse(product));
  }

  async buildSellerProductsTemplate(
    sellerId: string,
    cookieHeader: string | undefined,
  ) {
    const seller = await this.authProfileService.getCurrentSeller(cookieHeader);

    if (seller.accountId !== sellerId) {
      throw new ForbiddenException('Seller token does not match profile');
    }

    const products = await this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      file: buildProductTemplateWorkbook(
        products.map((product) => ({
          sku: product.sku,
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price.toNumber(),
          stock: product.stock,
          status: product.status as ProductTemplateRow['status'],
        })),
      ),
      fileName: buildStocksFileName(seller.storeName),
    };
  }

  async createSellerProduct(
    sellerId: string,
    cookieHeader: string | undefined,
    dto: CreateProductDto,
  ) {
    const seller = await this.authProfileService.getCurrentSeller(cookieHeader);

    if (seller.accountId !== sellerId) {
      throw new ForbiddenException('Seller token does not match profile');
    }

    if (seller.status !== 'ACTIVATED') {
      throw new ForbiddenException('Seller profile is not activated');
    }

    this.assertValidCategory(dto.category);

    const product = await this.handleSkuConflict(() =>
      this.prisma.product.create({
        data: {
          sellerId,
          storeName: seller.storeName,
          storeStatus: seller.status,
          sku: normalizeSku(dto.sku),
          name: dto.name.trim(),
          description: dto.description?.trim() ?? '',
          category: dto.category.trim(),
          price: new Prisma.Decimal(dto.price),
          stock: dto.stock,
          status: dto.status,
        },
      }),
    );

    return this.toResponse(product);
  }

  async updateSellerProduct(
    sellerId: string,
    productId: number,
    dto: UpdateProductDto,
  ) {
    await this.assertOwnsProduct(sellerId, productId);

    const data: Prisma.ProductUpdateInput = {};

    if (dto.sku !== undefined) {
      data.sku = normalizeSku(dto.sku);
    }

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }

    if (dto.category !== undefined) {
      this.assertValidCategory(dto.category);
      data.category = dto.category.trim();
    }

    if (dto.price !== undefined) {
      data.price = new Prisma.Decimal(dto.price);
    }

    if (dto.stock !== undefined) {
      data.stock = dto.stock;
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (
      data.name === '' ||
      data.category === '' ||
      data.sku === '' ||
      Object.keys(data).length === 0
    ) {
      throw new BadRequestException('Product update payload is invalid');
    }

    const product = await this.handleSkuConflict(() =>
      this.prisma.product.update({
        where: { id: productId },
        data,
      }),
    );

    return this.toResponse(product);
  }

  async importSellerProducts(
    sellerId: string,
    cookieHeader: string | undefined,
    file: Buffer,
  ) {
    const seller = await this.authProfileService.getCurrentSeller(cookieHeader);

    if (seller.accountId !== sellerId) {
      throw new ForbiddenException('Seller token does not match profile');
    }

    if (seller.status !== 'ACTIVATED') {
      throw new ForbiddenException('Seller profile is not activated');
    }

    const rows = parseProductWorkbook(file);

    if (!rows.length) {
      throw new BadRequestException('В Excel-файле нет товаров');
    }

    const errors: string[] = [];
    const rowsBySku = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      row.sku = normalizeSku(row.sku);
      row.category = row.category.trim();
      row.name = row.name.trim();
      row.description = row.description.trim();
      row.action = row.action?.trim().toLowerCase() ?? '';
      const shouldDelete = row.action === 'delete';

      if (!row.sku) {
        errors.push(`Строка ${row.rowNumber}: заполните SKU`);
      }

      if (rowsBySku.has(row.sku)) {
        errors.push(
          `Строка ${row.rowNumber}: SKU ${row.sku} повторяется в файле`,
        );
      }

      if (row.action && !isTemplateAction(row.action)) {
        errors.push(`Row ${row.rowNumber}: action must be delete or empty`);
      }

      if (!shouldDelete && !row.name) {
        errors.push(`Строка ${row.rowNumber}: заполните название`);
      }

      if (
        !shouldDelete &&
        !productCategories.includes(
          row.category as (typeof productCategories)[number],
        )
      ) {
        errors.push(`Строка ${row.rowNumber}: выберите категорию из шаблона`);
      }

      if (!shouldDelete && row.price <= 0) {
        errors.push(`Строка ${row.rowNumber}: цена должна быть больше 0`);
      }

      if (!shouldDelete && (!Number.isInteger(row.stock) || row.stock < 0)) {
        errors.push(
          `Строка ${row.rowNumber}: остаток должен быть целым числом от 0`,
        );
      }

      if (!shouldDelete && !isTemplateStatus(row.status)) {
        errors.push(
          `Строка ${row.rowNumber}: статус должен быть active, draft или archived`,
        );
      }

      rowsBySku.set(row.sku, row);
    }

    const existingProducts = await this.prisma.product.findMany({
      where: { sku: { in: [...rowsBySku.keys()] } },
    });

    for (const product of existingProducts) {
      if (product.sellerId !== sellerId) {
        errors.push(`SKU ${product.sku} уже занят другим продавцом`);
      }
    }

    if (errors.length) {
      throw new ConflictException({
        message: 'Проверьте Excel-файл',
        errors,
      });
    }

    const existingBySku = new Map(
      existingProducts.map((product) => [product.sku, product]),
    );
    let created = 0;
    let updated = 0;
    let deleted = 0;

    await this.prisma.$transaction(
      [...rowsBySku.values()].map((row) => {
        const existingProduct = existingBySku.get(row.sku);

        if (row.action === 'delete') {
          if (!existingProduct) {
            return this.prisma.product.count({ where: { sku: row.sku } });
          }

          deleted += 1;
          return this.prisma.product.delete({
            where: { id: existingProduct.id },
          });
        }

        const data = {
          sellerId,
          storeName: seller.storeName,
          storeStatus: seller.status,
          sku: row.sku,
          name: row.name,
          description: row.description,
          category: row.category,
          price: new Prisma.Decimal(row.price),
          stock: row.stock,
          status: row.status,
        };

        if (existingProduct) {
          updated += 1;
          return this.prisma.product.update({
            where: { id: existingProduct.id },
            data,
          });
        }

        created += 1;
        return this.prisma.product.create({ data });
      }),
    );

    return {
      created,
      updated,
      deleted,
      total: created + updated + deleted,
    };
  }

  async deleteSellerProduct(sellerId: string, productId: number) {
    await this.assertOwnsProduct(sellerId, productId);

    await this.prisma.product.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted' };
  }

  private async assertOwnsProduct(sellerId: string, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, sellerId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  private assertValidCategory(category: string) {
    if (
      !productCategories.includes(
        category.trim() as (typeof productCategories)[number],
      )
    ) {
      throw new BadRequestException('Product category is invalid');
    }
  }

  private async handleSkuConflict<T>(action: () => Promise<T>) {
    try {
      return await action();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('SKU уже занят');
      }

      throw error;
    }
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
}

function normalizeSku(value: string) {
  return value.trim().toUpperCase();
}

function buildStocksFileName(storeName: string) {
  const name = storeName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${name || 'store'}-stocks.xlsx`;
}
