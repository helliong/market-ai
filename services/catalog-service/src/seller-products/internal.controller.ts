import { Body, Controller, Patch, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SellerProductsService } from './seller-products.service';

@Controller('internal/sellers')
@ApiTags('Internal')
export class InternalController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Patch(':sellerId/store-profile')
  @ApiOperation({
    summary: 'Update seller profile in catalog',
    description: 'Internal endpoint called by auth-service to sync storeName and storeStatus.',
  })
  async updateSellerProfile(
    @Param('sellerId') sellerId: string,
    @Body() dto: { storeName?: string; storeStatus?: string },
  ) {
    return this.sellerProductsService.updateSellerProfile(sellerId, dto);
  }
}
