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
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
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
@ApiTags('Seller products')
@ApiCookieAuth('sellerAccessToken')
@ApiUnauthorizedResponse({
  description:
    'Missing, expired or invalid sellerAccessToken cookie. Login through auth-service /auth/seller/login first.',
})
export class SellerProductsController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List current seller products',
    description:
      'Returns products owned by the seller from the sellerAccessToken cookie.',
  })
  @ApiOkResponse({ description: 'Current seller products.' })
  findSellerProducts(@Req() req: AuthenticatedRequest) {
    return this.sellerProductsService.findSellerProducts(this.getSellerId(req));
  }

  @Get('template')
  @ApiOperation({
    summary: 'Download product import template',
    description:
      'Builds an XLSX template for the current seller, including seller-aware import columns.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description: 'XLSX import template file.',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Import seller products from XLSX',
    description:
      'Imports products for the current seller from an uploaded spreadsheet file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'XLSX file generated from the seller import template.',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Import result.' })
  @ApiResponse({
    status: 400,
    description: 'No file uploaded or file is invalid.',
  })
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
  @ApiOperation({
    summary: 'Create seller product',
    description: 'Creates a product owned by the current seller.',
  })
  @ApiCreatedResponse({ description: 'Created seller product.' })
  @ApiResponse({ status: 400, description: 'Product data is invalid.' })
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
  @ApiOperation({
    summary: 'Update seller product',
    description: 'Updates an existing product owned by the current seller.',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Updated seller product.' })
  @ApiResponse({ status: 400, description: 'Product data is invalid.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found for current seller.',
  })
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
  @ApiOperation({
    summary: 'Delete seller product',
    description: 'Deletes a product owned by the current seller.',
  })
  @ApiParam({ name: 'productId', type: Number, example: 1 })
  @ApiOkResponse({ description: 'Deleted seller product.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found for current seller.',
  })
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
