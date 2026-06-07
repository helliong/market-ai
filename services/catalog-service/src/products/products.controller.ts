import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findProducts() {
    return this.productsService.findProducts();
  }

  @Get(':productId')
  findProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findProduct(productId);
  }

  @Get('sku/:sku')
  findProductBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }
}
