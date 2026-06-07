import { Body, Controller, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductStockMutationDto } from './dto/product-stock.dto';

@Controller('internal/products')
export class InternalProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('stock/reserve')
  reserveProductsStock(@Body() dto: ProductStockMutationDto) {
    return this.productsService.reserveProductsStock(dto.items);
  }

  @Post('stock/release')
  releaseProductsStock(@Body() dto: ProductStockMutationDto) {
    return this.productsService.releaseProductsStock(dto.items);
  }
}
