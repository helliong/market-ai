import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductStockMutationDto } from './dto/product-stock.dto';

@ApiTags('Internal')
@Controller('internal/products')
export class InternalProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('stock/reserve')
  @ApiOperation({ summary: 'Reserve product stock for checkout' })
  @ApiOkResponse({ description: 'Stock reservation result.' })
  reserveProductsStock(@Body() dto: ProductStockMutationDto) {
    return this.productsService.reserveProductsStock(dto.items);
  }

  @Post('stock/release')
  @ApiOperation({ summary: 'Release reserved product stock' })
  @ApiOkResponse({ description: 'Stock release result.' })
  releaseProductsStock(@Body() dto: ProductStockMutationDto) {
    return this.productsService.releaseProductsStock(dto.items);
  }
}
