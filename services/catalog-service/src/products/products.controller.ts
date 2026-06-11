import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findProducts() {
    return this.productsService.findProducts();
  }

  @Get('search')
  searchProducts(@Query('q') query = '') {
    return this.productsService.searchProducts(query);
  }

  @Get('sku/:sku')
  findProductBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }

  @Get(':productId')
  findProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findProduct(productId);
  }
}
