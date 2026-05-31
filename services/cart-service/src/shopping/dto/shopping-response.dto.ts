import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty({
    example: 8,
    description: 'Product identifier from the catalog.',
  })
  productId: number;

  @ApiProperty({
    example: 3,
    description: 'Current quantity in the buyer cart.',
  })
  quantity: number;
}

export class CartResponseDto {
  @ApiProperty({
    type: [CartItemResponseDto],
    description:
      'Buyer cart items. Product titles, prices and images are resolved by the client/catalog using productId.',
  })
  items: CartItemResponseDto[];
}

export class IdsResponseDto {
  @ApiProperty({
    example: [2, 8, 14],
    description: 'Product ids stored in the buyer collection.',
  })
  ids: number[];
}

export class CompareResponseDto extends IdsResponseDto {
  @ApiProperty({
    example: 6,
    description: 'Maximum number of products allowed in compare list.',
  })
  limit: number;
}
