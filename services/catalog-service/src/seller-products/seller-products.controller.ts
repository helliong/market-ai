import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { Response } from 'express';
import { SellerJwtAuthGuard } from '../auth/seller-jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellerProductsService } from './seller-products.service';

type AuthenticatedRequest = Request & {
  user?: {
    sub?: string;
  };
};

@UseGuards(SellerJwtAuthGuard)
@Controller('seller/products')
export class SellerProductsController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Get()
  findSellerProducts(@Req() req: AuthenticatedRequest) {
    return this.sellerProductsService.findSellerProducts(this.getSellerId(req));
  }

  @Get('template')
  async downloadTemplate(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const template =
      await this.sellerProductsService.buildSellerProductsTemplate(
        this.getSellerId(req),
        req.headers.cookie,
      );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      buildAttachmentHeader(template.fileName),
    );
    res.send(template.file);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importProducts(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: { buffer?: Buffer },
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }

    return this.sellerProductsService.importSellerProducts(
      this.getSellerId(req),
      req.headers.cookie,
      file.buffer,
    );
  }

  @Post()
  createSellerProduct(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProductDto,
  ) {
    return this.sellerProductsService.createSellerProduct(
      this.getSellerId(req),
      req.headers.cookie,
      dto,
    );
  }

  @Patch(':productId')
  updateSellerProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.sellerProductsService.updateSellerProduct(
      this.getSellerId(req),
      productId,
      dto,
    );
  }

  @Delete(':productId')
  deleteSellerProduct(
    @Req() req: AuthenticatedRequest,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.sellerProductsService.deleteSellerProduct(
      this.getSellerId(req),
      productId,
    );
  }

  private getSellerId(req: AuthenticatedRequest) {
    const sellerId = req.user?.sub;

    if (!sellerId) {
      throw new UnauthorizedException('No seller account');
    }

    return sellerId;
  }
}

function buildAttachmentHeader(fileName: string) {
  const asciiFileName = fileName.replace(/[^\x20-\x7e]+/g, '_');
  return `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
