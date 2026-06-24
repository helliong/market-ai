import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Public products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List public active products' })
  @ApiOkResponse({ description: 'Public product catalog.' })
  findProducts(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const cursorNum = cursor ? parseInt(cursor, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : 24;
    return this.productsService.findProducts(cursorNum, limitNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search public products' })
  @ApiOkResponse({ description: 'Products matched by query.' })
  searchProducts(@Query('q') query = '') {
    return this.productsService.searchProducts(query);
  }

  @Get('suggests')
  @ApiOperation({ summary: 'Get product search suggestions' })
  @ApiOkResponse({ description: 'Suggested product names or queries.' })
  suggestProducts(@Query('q') query = '') {
    return this.productsService.suggestProducts(query);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get public product by SKU' })
  @ApiOkResponse({ description: 'Product matching the SKU.' })
  findProductBySku(@Param('sku') sku: string) {
    return this.productsService.findProductBySku(sku);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get public product by id' })
  @ApiOkResponse({ description: 'Product matching the numeric id.' })
  findProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.productsService.findProduct(productId);
  }
}
