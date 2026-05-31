import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({
    example: 8,
    minimum: 1,
    description: 'Product identifier from the catalog.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    maximum: 999,
    description:
      'Quantity to add. If omitted, one item is added. Existing cart items are incremented by this value.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999)
  quantity?: number;
}
